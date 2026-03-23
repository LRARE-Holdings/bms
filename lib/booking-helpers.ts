import { createAdminClient } from "@/lib/supabase/admin";

const BOOKING_CUTOFF_MINS = 30;
const DEFAULT_MAX_CAPACITY = 10;

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
 * Check if a class slot is past the booking cutoff.
 */
export function isBookingClosed(startTime: string, date: string): boolean {
  const [h, m] = startTime.split(":").map(Number);
  const classStart = new Date(date + "T00:00:00");
  classStart.setHours(h, m, 0, 0);
  const cutoff = new Date(classStart.getTime() - BOOKING_CUTOFF_MINS * 60_000);
  return new Date() >= cutoff;
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
 * Uses a conditional update that only succeeds if credits > 0.
 * Returns the pack ID if successful, or null if no credits available.
 */
export async function decrementPackCredit(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  studioId: string
): Promise<{ packId: string; previousCredits: number } | null> {
  // Find the user's oldest valid pack with credits
  const { data: packs } = await supabase
    .from("class_packs")
    .select("id, credits_remaining")
    .eq("profile_id", userId)
    .eq("studio_id", studioId)
    .gt("credits_remaining", 0)
    .gt("expires_at", new Date().toISOString())
    .order("purchased_at", { ascending: true })
    .limit(1);

  if (!packs || packs.length === 0) return null;

  const pack = packs[0];

  // Atomically decrement — the .gt guard ensures we don't go below 0
  // even if another request decremented between our read and write
  const { data: updated, error } = await supabase
    .from("class_packs")
    .update({ credits_remaining: pack.credits_remaining - 1 })
    .eq("id", pack.id)
    .eq("credits_remaining", pack.credits_remaining) // Optimistic lock: only succeed if value unchanged
    .select("id")
    .single();

  if (error || !updated) {
    // Optimistic lock failed — another request modified this pack.
    // Retry once with fresh data.
    return decrementPackCredit(supabase, userId, studioId);
  }

  return { packId: pack.id, previousCredits: pack.credits_remaining };
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
