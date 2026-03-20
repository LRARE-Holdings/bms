import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmation } from "@/lib/email/send";
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

  const { schedule_id, date } = await request.json();
  if (!schedule_id || !date) {
    return NextResponse.json(
      { error: "schedule_id and date are required" },
      { status: 400 }
    );
  }

  // 0. Check booking cutoff (30 min before class starts)
  const { data: scheduleSlot } = await supabase
    .from("schedule")
    .select("start_time")
    .eq("id", schedule_id)
    .eq("studio_id", studioId)
    .single();

  if (!scheduleSlot) {
    return NextResponse.json({ error: "Schedule slot not found" }, { status: 404 });
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

  // 1. Check user has a valid, non-expired pack with credits > 0
  const { data: packs } = await supabase
    .from("class_packs")
    .select("id, credits_remaining")
    .eq("profile_id", user.id)
    .eq("studio_id", studioId)
    .gt("credits_remaining", 0)
    .gt("expires_at", new Date().toISOString())
    .order("purchased_at", { ascending: true })
    .limit(1);

  if (!packs || packs.length === 0) {
    return NextResponse.json(
      { error: "No valid class pack with credits remaining" },
      { status: 400 }
    );
  }

  const pack = packs[0];

  // 2. Check class is not full (< 10 confirmed bookings)
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

  // 3. Check no duplicate booking
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

  // 4. Atomically decrement pack credits (guard against race conditions)
  const { data: updatedPack, error: packError } = await supabase
    .from("class_packs")
    .update({ credits_remaining: pack.credits_remaining - 1 })
    .eq("id", pack.id)
    .gt("credits_remaining", 0)
    .select("id")
    .single();

  if (packError || !updatedPack) {
    return NextResponse.json({ error: "No credits available" }, { status: 400 });
  }

  // 5. Create booking
  const { error: bookingError } = await supabase.from("bookings").insert({
    studio_id: studioId,
    schedule_id,
    profile_id: user.id,
    date,
    status: "confirmed",
    payment_method: "pack_credit",
  });

  if (bookingError) {
    // Re-increment credit on failure
    await supabase
      .from("class_packs")
      .update({ credits_remaining: pack.credits_remaining })
      .eq("id", pack.id);

    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }

  sendBookingConfirmation({
    profileId: user.id,
    studioId,
    scheduleId: schedule_id,
    date,
    paymentMethod: "pack_credit",
  });

  return NextResponse.json({ success: true });
}
