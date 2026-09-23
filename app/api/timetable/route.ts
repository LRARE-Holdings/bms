import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioId } from "@/lib/studio-context";
import {
  PRICING_COLUMNS,
  effectivePricePence,
  discountPercentOn,
} from "@/lib/pricing";
import type { DiscountableClass } from "@/lib/pricing";
import {
  SCHEDULE_RULE_COLUMNS,
  normaliseRule,
  slotRunsOn,
  isSlotInHoliday,
  type HolidayWindow,
} from "@/lib/schedule-rules";

const DEFAULT_MAX_CAPACITY = 10;

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
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  function toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const supabase = await createClient();

  // Fetch schedule with class and instructor data (including max_capacity).
  // Pull the parent rule in full — recurrence and is_active as well as the date
  // window. Selecting only the window made a fortnightly class render every
  // week and left a paused rule bookable here after it had gone from the
  // dashboard. Rows with rule_id=NULL are standing weekly entries.
  const { data: scheduleSlots, error } = await supabase
    .from("schedule")
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      rule_id,
      classes!inner(name, slug, duration_mins, capacity, ${PRICING_COLUMNS}),
      instructors!inner(name),
      schedule_rules(${SCHEDULE_RULE_COLUMNS})
    `)
    .eq("studio_id", studioId)
    .eq("is_active", true)
    .order("start_time");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Use admin client to bypass RLS — spot availability is public information,
  // but the bookings RLS policy restricts SELECT to the booking owner.
  const weekStartStr = toDateStr(weekStart);
  const weekEndStr = toDateStr(weekEnd);
  const adminClient = createAdminClient();

  // Fetch booking counts, schedule exceptions (skips), and studio holidays for this week
  const [{ data: bookings }, { data: exceptions }, { data: holidays }] =
    await Promise.all([
      adminClient
        .from("bookings")
        .select("schedule_id, date")
        .eq("studio_id", studioId)
        .eq("status", "confirmed")
        .gte("date", weekStartStr)
        .lte("date", weekEndStr),
      adminClient
        .from("schedule_exceptions")
        .select("schedule_id, date")
        .eq("studio_id", studioId)
        .gte("date", weekStartStr)
        .lte("date", weekEndStr),
      adminClient
        .from("studio_holidays")
        .select("start_date, end_date, start_time, end_time")
        .eq("studio_id", studioId)
        .lte("start_date", weekEndStr)
        .gte("end_date", weekStartStr),
    ]);

  // Build a set of skipped schedule_id:date combos for O(1) lookup
  const skippedSet = new Set(
    (exceptions ?? []).map((e) => `${e.schedule_id}_${e.date}`)
  );

  const holidayWindows = (holidays ?? []) as HolidayWindow[];

  // Count bookings per schedule_id + date
  const bookingCounts: Record<string, number> = {};
  if (bookings) {
    for (const b of bookings) {
      const key = `${b.schedule_id}_${b.date}`;
      bookingCounts[key] = (bookingCounts[key] || 0) + 1;
    }
  }

  // Build response — filter out skipped and holiday slots
  const slots = (scheduleSlots || [])
    .map((slot: Record<string, unknown>) => {
      const cls = slot.classes as Record<string, unknown> & DiscountableClass;
      const instructor = slot.instructors as Record<string, unknown>;
      const rule = normaliseRule(slot.schedule_rules);

      const slotDate = new Date(weekStart);
      slotDate.setDate(slotDate.getDate() + (slot.day_of_week as number));
      const dateStr = toDateStr(slotDate);

      const key = `${slot.id}_${dateStr}`;
      const bookingCount = bookingCounts[key] || 0;
      const maxCapacity = (cls.capacity as number) ?? DEFAULT_MAX_CAPACITY;

      return {
        schedule_id: slot.id,
        class_id: cls.id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        date: dateStr,
        class_name: cls.name,
        class_slug: cls.slug,
        duration_mins: cls.duration_mins,
        price_pence: cls.price_pence,
        // Priced by the slot's own date, so an October session shows October's
        // price to someone booking it in September.
        effective_price_pence: effectivePricePence(cls, dateStr),
        discount_percent: discountPercentOn(cls, dateStr),
        max_capacity: maxCapacity,
        instructor_name: instructor.name,
        booking_count: bookingCount,
        spots_remaining: maxCapacity - bookingCount,
        rule,
      };
    })
    .filter((slot) => {
      const key = `${slot.schedule_id}_${slot.date}`;
      if (skippedSet.has(key)) return false;
      if (
        isSlotInHoliday(
          holidayWindows,
          slot.date,
          slot.start_time as string
        )
      ) {
        return false;
      }
      // Recurrence, rule window and is_active, in one place.
      return slotRunsOn(
        { day_of_week: slot.day_of_week as number, rule: slot.rule },
        slot.date
      );
    });

  return NextResponse.json({
    week_start: weekStartStr,
    week_end: weekEndStr,
    slots: slots.map(({ rule, ...rest }) => rest),
  });
}
