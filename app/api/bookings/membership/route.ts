import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmation } from "@/lib/email/send";
import { getStudioId } from "@/lib/studio-context";
import {
  isBookingClosed,
  getBookingCount,
  getClassCapacity,
} from "@/lib/booking-helpers";

const schema = z.object({
  schedule_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: NextRequest) {
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

  const { schedule_id, date } = parsed.data;

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

  // Fetch schedule slot with class info
  const { data: scheduleSlot } = await supabase
    .from("schedule")
    .select("start_time, class_id")
    .eq("id", schedule_id)
    .eq("studio_id", studioId)
    .single();

  if (!scheduleSlot) {
    return NextResponse.json(
      { error: "Schedule slot not found" },
      { status: 404 }
    );
  }

  if (isBookingClosed(scheduleSlot.start_time, date)) {
    return NextResponse.json(
      { error: "Bookings close 30 minutes before class starts" },
      { status: 400 }
    );
  }

  const [bookingCount, maxCapacity] = await Promise.all([
    getBookingCount(supabase, schedule_id, date, studioId),
    getClassCapacity(studioId, scheduleSlot.class_id),
  ]);

  if (bookingCount >= maxCapacity) {
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
