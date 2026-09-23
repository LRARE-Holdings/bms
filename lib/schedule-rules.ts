/**
 * Does a schedule slot actually run on a given date?
 *
 * A `schedule` row is a weekly pattern; `schedule_rules` says which dates that
 * pattern covers. This site used to read only the rule's `starts_on`/`ends_on`
 * window, which silently ignored two things:
 *
 *   - `recurrence` — a fortnightly or monthly class rendered here *every week*,
 *     and the booking routes accepted a booking for a date it does not run on.
 *   - `is_active` — pausing a rule in the dashboard removed the class from the
 *     dashboard and left it bookable on the public site.
 *
 * These rules match forma-admin's `ruleAppliesToDate` in `lib/schedule-utils.ts`.
 * Both have to agree, or the studio's timetable and this one show different
 * classes. (They already had: the admin expanded recurrence and this did not.)
 */

/** Columns a caller must select from `schedule_rules` for this to be correct. */
export const SCHEDULE_RULE_COLUMNS =
  "recurrence, day_of_week, starts_on, ends_on, is_active";

export interface ScheduleRule {
  recurrence: string;
  day_of_week: number;
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
}

/**
 * PostgREST returns an embedded to-one relationship as an object or, depending
 * on how it infers cardinality, a single-element array. Normalise both.
 */
export function normaliseRule(rel: unknown): ScheduleRule | null {
  const raw = Array.isArray(rel) ? rel[0] ?? null : rel ?? null;
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.starts_on !== "string") return null;
  return {
    recurrence: (r.recurrence as string) ?? "weekly",
    day_of_week: (r.day_of_week as number) ?? 0,
    starts_on: r.starts_on,
    ends_on: (r.ends_on as string | null) ?? null,
    // Absent from the select is treated as active so a caller that forgets the
    // column fails open rather than blanking the timetable.
    is_active: r.is_active === undefined ? true : !!r.is_active,
  };
}

/** Does this recurrence rule cover `dateStr` (YYYY-MM-DD)? */
export function ruleAppliesToDate(rule: ScheduleRule, dateStr: string): boolean {
  if (!rule.is_active) return false;

  const d = new Date(dateStr + "T00:00:00");
  const starts = new Date(rule.starts_on + "T00:00:00");
  const ends = rule.ends_on ? new Date(rule.ends_on + "T00:00:00") : null;

  if (d < starts) return false;
  if (ends && d > ends) return false;

  if (rule.recurrence === "weekly") return true;

  if (rule.recurrence === "fortnightly") {
    const diffMs = d.getTime() - starts.getTime();
    const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    return diffWeeks % 2 === 0;
  }

  if (rule.recurrence === "monthly") {
    // Same nth weekday of the month (e.g. 2nd Tuesday)
    const nthInMonth = Math.ceil(d.getDate() / 7);
    const nthInStart = Math.ceil(starts.getDate() / 7);
    return nthInMonth === nthInStart;
  }

  return true;
}

/** Convert a YYYY-MM-DD string to our 0=Monday weekday number. */
export function dayOfWeekFor(dateStr: string): number {
  const jsDow = new Date(dateStr + "T00:00:00").getDay(); // 0=Sun
  return jsDow === 0 ? 6 : jsDow - 1;
}

/**
 * The single question every read and every write should ask: does this slot run
 * on this date?
 *
 * A slot with no rule is a standing weekly entry added by hand — it runs on its
 * weekday, with no window and no recurrence.
 */
export function slotRunsOn(
  slot: { day_of_week: number; rule: ScheduleRule | null },
  dateStr: string
): boolean {
  if (dayOfWeekFor(dateStr) !== slot.day_of_week) return false;
  if (!slot.rule) return true;
  return ruleAppliesToDate(slot.rule, dateStr);
}

export interface HolidayWindow {
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
}

/**
 * Is a slot closed by a studio holiday?
 *
 * A holiday with no times is a full-day closure. One with times closes only the
 * classes starting inside [start_time, end_time) — which is how forma-admin
 * decides which bookings to cancel. This site used to ignore the times entirely
 * and blank the whole day, so a two-hour closure hid a full day of classes.
 */
export function isSlotInHoliday(
  holidays: HolidayWindow[],
  dateStr: string,
  slotStartTime: string
): boolean {
  return holidays.some((h) => {
    if (dateStr < h.start_date || dateStr > h.end_date) return false;
    if (!h.start_time || !h.end_time) return true;
    return slotStartTime >= h.start_time && slotStartTime < h.end_time;
  });
}
