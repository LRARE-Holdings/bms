export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStudioId } from "@/lib/auth";
import { ukDateStr } from "@/lib/date-utils";
import { getEventAvailability, getEventMemberState } from "@/lib/event-tickets";
import EventCard from "@/components/events/event-card";
import PageHeader from "@/components/ui/page-header";
import type { EventMemberState, StudioEvent } from "@/lib/types";

export const metadata: Metadata = {
  title: "Events | Burn Mat Studio",
  description: "Workshops, socials and special sessions at Burn Mat Studio in Stockton-on-Tees.",
};

export default async function EventsPage() {
  const supabase = await createClient();
  const studioId = await getStudioId();

  const [{ data }, { data: { user } }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("studio_id", studioId)
      .eq("is_published", true)
      .is("cancelled_at", null)
      .gte("event_date", ukDateStr())
      .order("event_date")
      .order("start_time", { nullsFirst: true }),
    supabase.auth.getUser(),
  ]);

  const events = (data as StudioEvent[] | null) ?? [];
  const ticketedIds = events.filter((e) => e.tickets_enabled).map((e) => e.id);
  const [availability, memberState] = await Promise.all([
    getEventAvailability(ticketedIds),
    user ? getEventMemberState(user.id, ticketedIds) : Promise.resolve({} as Record<string, EventMemberState>),
  ]);

  return (
    <section className="pt-24 md:pt-28 pb-20 px-5 md:px-8 max-w-[1100px] mx-auto">
      <PageHeader
        label="Coming up"
        title="Events at the studio"
        description="Workshops, socials and special sessions happening at Burn."
      />
      {events.length === 0 ? (
        <div className="bg-white border border-sand rounded-2xl p-10 text-center">
          <p className="text-[0.92rem] text-warm-grey mb-5">
            Nothing on the calendar just yet. Check back soon, or come to a class in the meantime.
          </p>
          <Link
            href="/#timetable"
            className="inline-block px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
          >
            View the timetable
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              availability={availability[event.id]}
              profileId={user?.id ?? null}
              member={memberState[event.id] ?? null}
            />
          ))}
        </div>
      )}
    </section>
  );
}
