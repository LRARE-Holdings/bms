/**
 * Return a YYYY-MM-DD string in the local timezone (not UTC).
 * `new Date().toISOString().split("T")[0]` returns UTC, which is wrong
 * during BST or any UTC+ offset — e.g. 11pm on 31 Mar BST is 1 Apr UTC.
 */
export function localDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Same as localDateStr but for converting an existing Date that was
 * constructed from a local date string (e.g. via `new Date(str + "T00:00:00")`).
 */
export function dateToDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Today's date as YYYY-MM-DD in UK time, whatever zone the server runs in.
 * Vercel runs in UTC, so localDateStr() on the server is a day behind from
 * midnight to 1am during BST.
 */
export function ukDateStr(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(date);
}

/**
 * Has something on this UK date, starting at this UK time, already started?
 * With no start time it counts as starting at midnight.
 */
export function hasStartedUK(date: string, startTime: string | null): boolean {
  const now = new Date();
  const today = ukDateStr(now);
  if (date !== today) return date < today;
  if (!startTime) return true;
  const nowTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  return nowTime >= startTime.slice(0, 5);
}

/** Minutes the UK is ahead of UTC at an instant (0 in GMT, 60 in BST). */
function ukOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/**
 * A UK wall-clock date and time ("2026-10-11", "19:00") as a Date. Vercel runs
 * in UTC, so `new Date("2026-10-11T19:00")` would be an hour out all summer.
 */
export function ukWallClockToDate(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  // Right except within an hour of a clock change; a second pass settles it.
  let instant = guess - ukOffsetMinutes(new Date(guess)) * 60000;
  instant = guess - ukOffsetMinutes(new Date(instant)) * 60000;
  return new Date(instant);
}
