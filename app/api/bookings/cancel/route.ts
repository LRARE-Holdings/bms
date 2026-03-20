import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBookingCancellation } from "@/lib/email/send";
import { getStudioId } from "@/lib/studio-context";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const studioId = await getStudioId();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { booking_id } = await request.json();
  if (!booking_id) {
    return NextResponse.json(
      { error: "booking_id is required" },
      { status: 400 }
    );
  }

  // Fetch the booking — user must own it
  const { data: booking, error } = await supabase
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

  // Cancel the booking
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", booking_id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }

  // If paid with pack credit, re-increment credits
  if (booking.payment_method === "pack_credit") {
    // Find the user's oldest active pack to re-credit
    const { data: packs } = await supabase
      .from("class_packs")
      .select("id, credits_remaining, credits_total")
      .eq("profile_id", user.id)
      .eq("studio_id", studioId)
      .gt("expires_at", new Date().toISOString())
      .order("purchased_at", { ascending: true })
      .limit(1);

    if (packs && packs.length > 0) {
      const pack = packs[0];
      // Only re-credit up to credits_total
      const newCredits = Math.min(
        pack.credits_remaining + 1,
        pack.credits_total
      );
      await supabase
        .from("class_packs")
        .update({ credits_remaining: newCredits })
        .eq("id", pack.id);
    }
  }

  // Membership and complimentary bookings — just cancel, no credit operations

  sendBookingCancellation({
    profileId: user.id,
    studioId,
    scheduleId: booking.schedule_id,
    date: booking.date,
    creditRefunded: booking.payment_method === "pack_credit",
  });

  return NextResponse.json({ success: true });
}
