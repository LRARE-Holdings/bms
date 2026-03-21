export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { requireAuth, getStudioId } from "@/lib/auth";
import BookingList, { type BookingRow } from "@/components/account/booking-list";
import WaitlistList, { type WaitlistRow } from "@/components/account/waitlist-list";
import AccountHeader from "@/components/account/account-header";

export const metadata = {
  title: "My Bookings | Burn Mat Studio",
};

export default async function BookingsPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const studioId = await getStudioId();
  const today = new Date().toISOString().split("T")[0];

  const [{ data: upcomingBookings }, { data: pastBookings }, { data: waitlistEntries }] =
    await Promise.all([
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
    ]);

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
