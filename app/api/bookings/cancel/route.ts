import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingCancellation } from "@/lib/email/send";
import { getStudioId } from "@/lib/studio-context";
import { incrementPackCredit } from "@/lib/booking-helpers";

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
      .select("id, profile_id, payment_method, status, studio_id, schedule_id, date")
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

    // Cancel the booking via admin client (members have no UPDATE RLS policy)
    const { error: updateError } = await admin
      .from("bookings")
      .update({ status: "cancelled", cancelled_by: "member" })
      .eq("id", booking_id);

    if (updateError) {
      console.error("Booking cancel error:", updateError);
      return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
    }

    // Re-credit pack if applicable (admin client needed for class_packs UPDATE).
    // Complimentary bookings are one-shot: free_class_used stays true, no refund.
    let creditRefunded = false;
    if (booking.payment_method === "pack_credit") {
      creditRefunded = await incrementPackCredit(admin, user.id, studioId);
      if (!creditRefunded) {
        console.warn(
          `Failed to re-credit pack for booking ${booking_id} (user ${user.id}). ` +
          `Pack may be expired or at max credits.`
        );
      }
    }

    await sendBookingCancellation({
      profileId: user.id,
      studioId,
      scheduleId: booking.schedule_id,
      date: booking.date,
      creditRefunded,
      paymentMethod: booking.payment_method,
    });

    return NextResponse.json({ success: true, creditRefunded });
  } catch (err) {
    console.error("Booking cancellation error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
