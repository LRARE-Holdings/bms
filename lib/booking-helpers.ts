import { createAdminClient } from "@/lib/supabase/admin";

const BOOKING_CUTOFF_MINS = 30;
const DEFAULT_MAX_CAPACITY = 10;
const UK_TIMEZONE = "Europe/London";

/**
 * Get the current date/time in the UK timezone.
 * Vercel servers run in UTC — this ensures cutoff and horizon
 * calculations use UK local time (handles GMT/BST automatically).
 */
function nowUK(): Date {
  const ukString = new Date().toLocaleString("en-GB", { timeZone: UK_TIMEZONE });
  // en-GB format: "31/03/2026, 11:00:00" → parse back to Date
  const [datePart, timePart] = ukString.split(", ");
  const [day, month, year] = datePart.split("/");
  const [h, m, s] = timePart.split(":");
  return new Date(+year, +month - 1, +day, +h, +m, +s);
}

/**
 * Get the max capacity for a class. Falls back to DEFAULT_MAX_CAPACITY
 * if no max_capacity column exists on the classes table.
 */
export async function getClassCapacity(
  studioId: string,
  classId: string
): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("classes")
    .select("capacity")
    .eq("id", classId)
    .eq("studio_id", studioId)
    .single();

  return data?.capacity ?? DEFAULT_MAX_CAPACITY;
}

/**
 * Validate that the booking date falls on the correct day of week for the schedule slot.
 * day_of_week uses 0=Monday schema.
 */
export function validateBookingDay(
  scheduleDayOfWeek: number,
  date: string
): boolean {
  const d = new Date(date + "T00:00:00");
  const jsDow = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const schemaDow = jsDow === 0 ? 6 : jsDow - 1; // Convert to 0=Mon, 6=Sun
  return schemaDow === scheduleDayOfWeek;
}

/**
 * Check if a booking date is beyond the current booking horizon.
 * The timetable is released monthly, with next month opening 2 weeks before
 * its first day — so within that early-release window the horizon extends
 * to the end of next month.
 * Uses UK timezone so the horizon boundary aligns with the studio's local date.
 */
export function isBeyondBookingHorizon(date: string): boolean {
  const now = nowUK();
  const earlyRelease = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  earlyRelease.setDate(earlyRelease.getDate() - 14);
  const monthsAhead = now >= earlyRelease ? 2 : 1;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 0);
  const y = lastDay.getFullYear();
  const m = String(lastDay.getMonth() + 1).padStart(2, "0");
  const d = String(lastDay.getDate()).padStart(2, "0");
  return date > `${y}-${m}-${d}`;
}

/**
 * Check if a class slot is past the booking cutoff.
 * Class start_time is stored as UK local time (e.g. "18:00"),
 * so we compare against the current UK time.
 */
export function isBookingClosed(startTime: string, date: string): boolean {
  const [h, m] = startTime.split(":").map(Number);
  // Build a Date representing the class start in UK local time
  const [year, month, day] = date.split("-").map(Number);
  const classStart = new Date(year, month - 1, day, h, m, 0, 0);
  const cutoff = new Date(classStart.getTime() - BOOKING_CUTOFF_MINS * 60_000);
  return nowUK() >= cutoff;
}

/**
 * Check if a class instance is skipped (has a schedule_exception) or falls
 * within a studio holiday. Returns true if the class should not be bookable.
 */
export async function isClassSkipped(
  supabase: ReturnType<typeof createAdminClient>,
  studioId: string,
  scheduleId: string,
  date: string
): Promise<boolean> {
  const [{ data: exception }, { data: holidays }] = await Promise.all([
    supabase
      .from("schedule_exceptions")
      .select("id")
      .eq("studio_id", studioId)
      .eq("schedule_id", scheduleId)
      .eq("date", date)
      .maybeSingle(),
    supabase
      .from("studio_holidays")
      .select("id")
      .eq("studio_id", studioId)
      .lte("start_date", date)
      .gte("end_date", date)
      .limit(1),
  ]);

  return !!exception || (holidays != null && holidays.length > 0);
}

/**
 * Get the current confirmed booking count for a slot on a specific date.
 */
export async function getBookingCount(
  supabase: ReturnType<typeof createAdminClient>,
  scheduleId: string,
  date: string,
  studioId: string
): Promise<number> {
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("schedule_id", scheduleId)
    .eq("date", date)
    .eq("status", "confirmed")
    .eq("studio_id", studioId);

  return count ?? 0;
}

/**
 * Atomically decrement pack credits by 1.
 *
 * When a classId is provided, packs whose pack_tier excludes that class are
 * skipped. Packs with a null pack_tier_id (legacy or manually-issued credits)
 * are always eligible.
 *
 * Returns ok=false with a reason when nothing can be decremented so the caller
 * can distinguish "no credits at all" from "credits exist but none cover this
 * class".
 */
const MAX_DECREMENT_RETRIES = 3;

export type DecrementPackResult =
  | { ok: true; packId: string; previousCredits: number }
  | { ok: false; reason: "no_credits" | "class_excluded" };

export async function decrementPackCredit(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  studioId: string,
  classId: string | null,
  _retries = 0
): Promise<DecrementPackResult> {
  const excludedTierIds = classId
    ? await getExcludedPackTierIds(supabase, classId)
    : [];

  // Pull the user's valid packs in age order; we'll filter eligibility in JS
  // so we don't have to fight PostgREST's OR/IN syntax for the exclusion list.
  const { data: packs } = await supabase
    .from("class_packs")
    .select("id, credits_remaining, pack_tier_id")
    .eq("profile_id", userId)
    .eq("studio_id", studioId)
    .gt("credits_remaining", 0)
    .gt("expires_at", new Date().toISOString())
    .order("purchased_at", { ascending: true });

  if (!packs || packs.length === 0) {
    return { ok: false, reason: "no_credits" };
  }

  const eligiblePack = packs.find((p) => {
    const tierId = p.pack_tier_id as string | null;
    if (!tierId) return true;
    return !excludedTierIds.includes(tierId);
  });

  if (!eligiblePack) {
    return { ok: false, reason: "class_excluded" };
  }

  // Atomically decrement — the .eq guard ensures we don't double-decrement
  // when another request changed the value between read and write
  const { data: updated, error } = await supabase
    .from("class_packs")
    .update({ credits_remaining: eligiblePack.credits_remaining - 1 })
    .eq("id", eligiblePack.id)
    .eq("credits_remaining", eligiblePack.credits_remaining)
    .select("id")
    .single();

  if (error || !updated) {
    // Optimistic lock failed — another request modified this pack.
    // Retry with fresh data, up to a maximum number of attempts.
    if (_retries < MAX_DECREMENT_RETRIES) {
      return decrementPackCredit(supabase, userId, studioId, classId, _retries + 1);
    }
    return { ok: false, reason: "no_credits" };
  }

  return {
    ok: true,
    packId: eligiblePack.id,
    previousCredits: eligiblePack.credits_remaining,
  };
}

async function getExcludedPackTierIds(
  supabase: ReturnType<typeof createAdminClient>,
  classId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("pack_tier_excluded_classes")
    .select("pack_tier_id")
    .eq("class_id", classId);

  return (data ?? []).map((row) => row.pack_tier_id as string);
}

/**
 * Re-increment a pack credit (used on booking cancellation).
 * Only re-credits up to credits_total.
 */
export async function incrementPackCredit(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  studioId: string
): Promise<boolean> {
  const { data: packs } = await supabase
    .from("class_packs")
    .select("id, credits_remaining, credits_total")
    .eq("profile_id", userId)
    .eq("studio_id", studioId)
    .gt("expires_at", new Date().toISOString())
    .order("purchased_at", { ascending: true })
    .limit(1);

  if (!packs || packs.length === 0) return false;

  const pack = packs[0];
  if (pack.credits_remaining >= pack.credits_total) return false;

  const { error } = await supabase
    .from("class_packs")
    .update({ credits_remaining: pack.credits_remaining + 1 })
    .eq("id", pack.id)
    .eq("credits_remaining", pack.credits_remaining); // Optimistic lock

  return !error;
}
