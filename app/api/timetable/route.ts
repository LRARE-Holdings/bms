import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudioId } from "@/lib/studio-context";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studioId = await getStudioId();

  // Calculate week start (Monday)
  const weekStartParam = searchParams.get("week_start");
  let weekStart: Date;
  if (weekStartParam) {
    weekStart = new Date(weekStartParam + "T00:00:00");
  } else {
    weekStart = new Date();
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const supabase = await createClient();

  // Fetch schedule with class and instructor data
  const { data: scheduleSlots, error } = await supabase
    .from("schedule")
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      classes!inner(name, slug, duration_mins, price_pence),
      instructors!inner(name)
    `)
    .eq("studio_id", studioId)
    .eq("is_active", true)
    .order("start_time");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch booking counts for this week
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const { data: bookings } = await supabase
    .from("bookings")
    .select("schedule_id, date")
    .eq("studio_id", studioId)
    .eq("status", "confirmed")
    .gte("date", weekStartStr)
    .lte("date", weekEndStr);

  // Count bookings per schedule_id + date
  const bookingCounts: Record<string, number> = {};
  if (bookings) {
    for (const b of bookings) {
      const key = `${b.schedule_id}_${b.date}`;
      bookingCounts[key] = (bookingCounts[key] || 0) + 1;
    }
  }

  // Build response
  const slots = (scheduleSlots || []).map((slot: Record<string, unknown>) => {
    const cls = slot.classes as Record<string, unknown>;
    const instructor = slot.instructors as Record<string, unknown>;

    // Calculate the actual date for this slot in the current week
    const slotDate = new Date(weekStart);
    slotDate.setDate(slotDate.getDate() + (slot.day_of_week as number));
    const dateStr = slotDate.toISOString().split("T")[0];

    const key = `${slot.id}_${dateStr}`;
    const bookingCount = bookingCounts[key] || 0;

    return {
      schedule_id: slot.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      date: dateStr,
      class_name: cls.name,
      class_slug: cls.slug,
      duration_mins: cls.duration_mins,
      price_pence: cls.price_pence,
      instructor_name: instructor.name,
      booking_count: bookingCount,
      spots_remaining: 10 - bookingCount,
    };
  });

  return NextResponse.json({
    week_start: weekStartStr,
    week_end: weekEndStr,
    slots,
  });
}
