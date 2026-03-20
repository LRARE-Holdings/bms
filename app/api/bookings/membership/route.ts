import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmation } from "@/lib/email/send";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const studioId = process.env.NEXT_PUBLIC_STUDIO_ID!;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { schedule_id, date } = await request.json();
  if (!schedule_id || !date) {
    return NextResponse.json(
      { error: "schedule_id and date are required" },
      { status: 400 }
    );
  }

  // Check user has an active membership at this studio
  const { data: membership } = await supabase
    .from("memberships")
    .select("id, status, current_period_end")
    .eq("profile_id", user.id)
    .eq("studio_id", studioId)
    .eq("status", "active")
    .gt("current_period_end", new Date().toISOString())
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: "No active membership found" },
      { status: 400 }
    );
  }

  // Check booking cutoff (30 min before class)
  const { data: scheduleSlot } = await supabase
    .from("schedule")
    .select("start_time")
    .eq("id", schedule_id)
    .eq("studio_id", studioId)
    .single();

  if (!scheduleSlot) {
    return NextResponse.json(
      { error: "Schedule slot not found" },
      { status: 404 }
    );
  }

  const [h, m] = scheduleSlot.start_time.split(":").map(Number);
  const classStart = new Date(date + "T00:00:00");
  classStart.setHours(h, m, 0, 0);
  const cutoff = new Date(classStart.getTime() - 30 * 60_000);
  if (new Date() >= cutoff) {
    return NextResponse.json(
      { error: "Bookings close 30 minutes before class starts" },
      { status: 400 }
    );
  }

  // Check class not full
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("schedule_id", schedule_id)
    .eq("date", date)
    .eq("status", "confirmed")
    .eq("studio_id", studioId);

  if (count !== null && count >= 10) {
    return NextResponse.json({ error: "Class is full" }, { status: 400 });
  }

  // Check no duplicate booking
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("schedule_id", schedule_id)
    .eq("profile_id", user.id)
    .eq("date", date)
    .eq("status", "confirmed")
    .single();

  if (existingBooking) {
    return NextResponse.json(
      { error: "You already have a booking for this class" },
      { status: 400 }
    );
  }

  // Create booking
  const { error: bookingError } = await supabase.from("bookings").insert({
    studio_id: studioId,
    schedule_id,
    profile_id: user.id,
    date,
    status: "confirmed",
    payment_method: "membership",
  });

  if (bookingError) {
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }

  sendBookingConfirmation({
    profileId: user.id,
    studioId,
    scheduleId: schedule_id,
    date,
    paymentMethod: "membership",
  });

  return NextResponse.json({ success: true });
}
