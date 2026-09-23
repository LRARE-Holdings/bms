import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingCancellation } from "@/lib/email/send";
import { notifyCancellation } from "@/lib/email/notify-cancellation";
import { getStudioId } from "@/lib/studio-context";
import { restorePackCredit } from "@/lib/booking-helpers";
import { promoteWaitlist } from "@/lib/waitlist-promote";
import { hasStartedUK } from "@/lib/date-utils";
import { getStudioStripeAccount } from "@/lib/stripe";
import { refundMemberPayment } from "@/lib/refunds";

const schema = z.object({
  booking_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const studioId = await getStudioId();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { booking_id } = parsed.data;
    const admin = createAdminClient();

    // Fetch the booking via admin client (user RLS only allows SELECT, not UPDATE)
    const { data: booking, error } = await admin
      .from("bookings")
      .select("id, profile_id, payment_method, status, studio_id, schedule_id, date, stripe_session_id, schedule:schedule_id(start_time)")
      .eq("id", booking_id)
      .eq("studio_id", studioId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.profile_id !== user.id) {
      return NextResponse.json({ error: "Not your booking" }, { status: 403 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // The terms allow cancelling any time before the class starts — and a card
    // payment is refunded in full when they do, so the start time is enforced.
    const schedule = booking.schedule as unknown as { start_time: string } | null;
    if (hasStartedUK(booking.date, schedule?.start_time ?? null)) {
      return NextResponse.json(
        { error: "This class has already started, so it can't be cancelled." },
        { status: 400 }
      );
    }

    // Cancel the booking via admin client (members have no UPDATE RLS policy).
    // Conditional on still being confirmed, so of two simultaneous requests
    // only one gets past here — and only that one refunds.
    const { data: cancelled, error: updateError } = await admin
      .from("bookings")
      .update({ status: "cancelled", cancelled_by: "member", cancelled_at: new Date().toISOString() })
      .eq("id", booking_id)
      .eq("status", "confirmed")
      .select("id");

    if (updateError) {
      console.error("Booking cancel error:", updateError);
      return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
    }
    if (!cancelled || cancelled.length === 0) {
      return NextResponse.json({ error: "Booking is already cancelled" }, { status: 400 });
    }

    // Card payments are refunded in full to the card. A failure here does not
    // undo the cancellation: the member is told a refund is being arranged, and
    // the log says to refund by hand.
    let refundPence: number | null = null;
    let refundFailed = false;
    if (booking.payment_method === "stripe" && booking.stripe_session_id) {
      const stripeAccountId = await getStudioStripeAccount(studioId);
      const refund = stripeAccountId
        ? await refundMemberPayment({
            stripeId: booking.stripe_session_id,
            stripeAccountId,
            initiatedBy: "member_cancel",
            metadata: { booking_id },
          })
        : { ok: false as const, reason: "studio has no connected Stripe account" };
      if (refund.ok) {
        refundPence = refund.amountPence;
      } else {
        refundFailed = true;
        console.error(`[bookings/cancel] Refund FAILED for booking ${booking_id}: ${refund.reason}. REFUND BY HAND.`);
      }
    }

    // Return the credit to the pack that paid for the booking.
    // Complimentary bookings are one-shot: free_class_used stays true, no refund.
    //
    // Safe to call even though a database trigger covers this too: the function
    // will not pay out twice for the same booking.
    let creditRefunded = false;
    if (booking.payment_method === "pack_credit") {
      creditRefunded = await restorePackCredit(admin, booking_id);
    }

    await sendBookingCancellation({
      profileId: user.id,
      studioId,
      scheduleId: booking.schedule_id,
      date: booking.date,
      creditRefunded,
      paymentMethod: booking.payment_method,
      refundPence,
      refundFailed,
    });

    await notifyCancellation({
      studioId,
      profileId: user.id,
      scheduleId: booking.schedule_id,
      date: booking.date,
      paymentMethod: booking.payment_method,
      cancelledBy: "member",
    });

    // Offer the freed spot to the next person waiting. Awaited so the call
    // survives serverless teardown; it never throws.
    await promoteWaitlist({
      studioId,
      scheduleId: booking.schedule_id,
      date: booking.date,
    });

    return NextResponse.json({ success: true, creditRefunded, refundPence, refundFailed });
  } catch (err) {
    console.error("Booking cancellation error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
