import type { StudioEvent } from "@/lib/types";

// Event dates are UK calendar dates, not instants, so they are parsed as local
// dates on purpose — the server's own time zone never shifts the day.

export function eventDateParts(eventDate: string) {
  const d = new Date(`${eventDate}T00:00:00`);
  return {
    weekday: d.toLocaleDateString("en-GB", { weekday: "short" }),
    day: d.getDate(),
    month: d.toLocaleDateString("en-GB", { month: "short" }),
    long: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
    longWithYear: d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

/** "19:00 – 21:00", "19:00", or null for an all-day event */
export function formatEventTimes(event: Pick<StudioEvent, "start_time" | "end_time">): string | null {
  if (!event.start_time) return null;
  const start = event.start_time.slice(0, 5);
  return event.end_time ? `${start} – ${event.end_time.slice(0, 5)}` : start;
}
