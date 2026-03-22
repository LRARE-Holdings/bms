export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { requireAuth, getStudioId } from "@/lib/auth";
import BookingList, { type BookingRow } from "@/components/account/booking-list";
import WaitlistList, { type WaitlistRow } from "@/components/account/waitlist-list";
import AccountHeader from "@/components/account/account-header";
import MemberStats from "@/components/account/member-stats";

export const metadata = {
  title: "My Bookings | Burn Mat Studio",
};

export default async function BookingsPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const studioId = await getStudioId();
  const today = new Date().toISOString().split("T")[0];

  const [
    { data: upcomingBookings },
    { data: pastBookings },
    { data: waitlistEntries },
    { count: totalClassCount },
    { data: allPastDates },
    { data: activePacks },
  ] = await Promise.all([
      supabase
        .from("bookings")
        .select(
          `
          id,
          date,
          status,
          payment_method,
          schedule:schedule_id(
            start_time,
            classes(name, slug, duration_mins),
            instructors(name)
          )
        `
        )
        .eq("profile_id", user.id)
        .eq("studio_id", studioId)
        .eq("status", "confirmed")
        .gte("date", today)
        .order("date", { ascending: true }),
      supabase
        .from("bookings")
        .select(
          `
          id,
          date,
          status,
          payment_method,
          schedule:schedule_id(
            start_time,
            classes(name, slug, duration_mins),
            instructors(name)
          )
        `
        )
        .eq("profile_id", user.id)
        .eq("studio_id", studioId)
        .lt("date", today)
        .order("date", { ascending: false })
        .limit(20),
      supabase
        .from("waitlist")
        .select(
          `
          id,
          date,
          position,
          status,
          expires_at,
          schedule:schedule_id(
            start_time,
            classes(name, slug, duration_mins),
            instructors(name)
          )
        `
        )
        .eq("profile_id", user.id)
        .eq("studio_id", studioId)
        .in("status", ["waiting", "offered"])
        .gte("date", today)
        .order("date", { ascending: true }),
      // Total confirmed bookings (past)
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id)
        .eq("studio_id", studioId)
        .eq("status", "confirmed")
        .lt("date", today),
      // All past booking dates for streak calculation
      supabase
        .from("bookings")
        .select("date")
        .eq("profile_id", user.id)
        .eq("studio_id", studioId)
        .eq("status", "confirmed")
        .lt("date", today)
        .order("date", { ascending: false })
        .limit(52),
      // Active packs for credit stats
      supabase
        .from("class_packs")
        .select("credits_remaining, expires_at")
        .eq("profile_id", user.id)
        .eq("studio_id", studioId)
        .gt("credits_remaining", 0)
        .gt("expires_at", new Date().toISOString()),
    ]);

  // Calculate week streak from past booking dates
  function calculateWeekStreak(dates: { date: string }[]): number {
    if (!dates || dates.length === 0) return 0;

    const uniqueWeeks = new Set<string>();
    for (const { date } of dates) {
      const d = new Date(date + "T00:00:00");
      // Get Monday of that week
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      uniqueWeeks.add(d.toISOString().split("T")[0]);
    }

    const sortedWeeks = Array.from(uniqueWeeks).sort().reverse();
    let streak = 0;

    // Check if the most recent week is this week or last week
    const now = new Date();
    const currentDay = now.getDay();
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    currentMonday.setHours(0, 0, 0, 0);
    const currentWeekStr = currentMonday.toISOString().split("T")[0];

    const lastMonday = new Date(currentMonday);
    lastMonday.setDate(lastMonday.getDate() - 7);
    const lastWeekStr = lastMonday.toISOString().split("T")[0];

    // Start counting from the most recent booking week
    if (sortedWeeks[0] !== currentWeekStr && sortedWeeks[0] !== lastWeekStr) {
      return 0;
    }

    let expectedWeek = new Date(sortedWeeks[0] + "T00:00:00");
    for (const week of sortedWeeks) {
      const weekDate = new Date(week + "T00:00:00");
      if (weekDate.getTime() === expectedWeek.getTime()) {
        streak++;
        expectedWeek.setDate(expectedWeek.getDate() - 7);
      } else {
        break;
      }
    }

    return streak;
  }

  const totalClasses = totalClassCount ?? 0;
  const weekStreak = calculateWeekStreak(allPastDates ?? []);

  const creditsRemaining = (activePacks ?? []).reduce(
    (sum, p) => sum + p.credits_remaining, 0
  );

  // Find soonest expiring pack
  const soonestExpiry = (activePacks ?? [])
    .map((p) => new Date(p.expires_at))
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

  const daysUntilExpiry = soonestExpiry
    ? Math.ceil((soonestExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const creditsExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 14
    ? (activePacks ?? [])
        .filter((p) => {
          const d = Math.ceil((new Date(p.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return d <= 14;
        })
        .reduce((sum, p) => sum + p.credits_remaining, 0)
    : 0;

  // Normalize booking rows — Supabase may return nested joins as arrays
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function normalizeBookings(raw: any[]): BookingRow[] {
    return raw.map((b) => {
      const sched = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
      const cls = sched?.classes;
      const inst = sched?.instructors;
      return {
        id: b.id,
        date: b.date,
        status: b.status,
        payment_method: b.payment_method,
        schedule: {
          start_time: sched?.start_time || "",
          classes: Array.isArray(cls) ? cls[0] : cls,
          instructors: Array.isArray(inst) ? inst[0] : inst,
        },
      };
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function normalizeWaitlist(raw: any[]): WaitlistRow[] {
    return raw.map((w) => {
      const sched = Array.isArray(w.schedule) ? w.schedule[0] : w.schedule;
      const cls = sched?.classes;
      const inst = sched?.instructors;
      return {
        id: w.id,
        date: w.date,
        position: w.position,
        status: w.status,
        expires_at: w.expires_at,
        schedule: {
          start_time: sched?.start_time || "",
          classes: Array.isArray(cls) ? cls[0] : cls,
          instructors: Array.isArray(inst) ? inst[0] : inst,
        },
      };
    });
  }

  const normalizedWaitlist = normalizeWaitlist(waitlistEntries || []);

  return (
    <section className="py-10 px-5 md:px-10 max-w-[1100px]">
      <AccountHeader
        eyebrow="My bookings"
        title="Upcoming"
        subtitle="Your confirmed classes. Cancel up to 24 hours before the class starts."
      />

      <MemberStats
        totalClasses={totalClasses}
        weekStreak={weekStreak}
        creditsRemaining={creditsRemaining}
        creditsExpiringSoon={creditsExpiringSoon}
        daysUntilExpiry={daysUntilExpiry}
      />

      <BookingList
        bookings={normalizeBookings(upcomingBookings || [])}
        emptyMessage="No upcoming bookings. Book a class from the timetable."
        showCancel
      />

      {/* Waitlist */}
      {normalizedWaitlist.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-[clamp(1.4rem,2.5vw,1.8rem)] font-semibold text-cocoa leading-tight mb-2">
            Waitlist
          </h2>
          <p className="text-[0.82rem] text-warm-grey mb-6">
            You&apos;ll be emailed if a spot opens up. You&apos;ll have 30
            minutes to claim it.
          </p>
          <WaitlistList entries={normalizedWaitlist} />
        </div>
      )}

      {/* Past bookings */}
      <div className="mt-12">
        <h2 className="font-display text-[clamp(1.4rem,2.5vw,1.8rem)] font-semibold text-cocoa leading-tight mb-6">
          Past bookings
        </h2>
        <BookingList
          bookings={normalizeBookings(pastBookings || [])}
          emptyMessage="No past bookings yet."
        />
      </div>
    </section>
  );
}
