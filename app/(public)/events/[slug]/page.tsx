export const dynamic = "force-dynamic";

import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudioId } from "@/lib/auth";
import { ukDateStr } from "@/lib/date-utils";
import { siteUrl } from "@/lib/site-url";
import { eventDateParts, formatEventTimes } from "@/lib/event-format";
import { getEventAvailability, getEventMemberState, formatPounds } from "@/lib/event-tickets";
import EventTicketActions from "@/components/events/event-ticket-actions";
import EventShare from "@/components/events/event-share";
import type { EventAvailability, EventMemberState, StudioEvent } from "@/lib/types";

/**
 * /events/[slug] — the page Lucy shares on social media and with collaborators.
 *
 * Cancelled and finished events keep their page, saying so, because links to
 * them are already out in the world. Only drafts (unpublished) 404.
 */

// Shared by generateMetadata and the page, so the event is fetched once.
const loadEvent = cache(async (slug: string): Promise<StudioEvent | null> => {
  const supabase = await createClient();
  const studioId = await getStudioId();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("studio_id", studioId)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as StudioEvent | null) ?? null;
});

function summary(event: StudioEvent): string {
  const when = [eventDateParts(event.event_date).long, formatEventTimes(event)].filter(Boolean).join(", ");
  const text = event.description.replace(/\s+/g, " ").trim();
  const excerpt = text.length > 150 ? `${text.slice(0, 147).trimEnd()}…` : text;
  return excerpt ? `${when}. ${excerpt}` : when;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) return { title: "Event not found | Burn Mat Studio" };

  const url = `${siteUrl()}/events/${event.slug}`;
  const image = event.image_url ?? `${siteUrl()}/studio.png`;
  const title = `${event.title} | Burn Mat Studio`;
  const description = summary(event);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: event.title,
      description,
      url,
      type: "website",
      siteName: "Burn Mat Studio",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: [image],
    },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cancelled = !!event.cancelled_at;
  const finished = event.event_date < ukDateStr();
  const live = !cancelled && !finished;

  const sellsTickets = live && event.tickets_enabled;
  const [availability, memberState] = await Promise.all([
    sellsTickets ? getEventAvailability([event.id]) : Promise.resolve({} as Record<string, EventAvailability>),
    sellsTickets && user
      ? getEventMemberState(user.id, [event.id])
      : Promise.resolve({} as Record<string, EventMemberState>),
  ]);

  const date = eventDateParts(event.event_date);
  const times = formatEventTimes(event);
  const url = `${siteUrl()}/events/${event.slug}`;
  const eventAvailability = availability[event.id];
  const member = memberState[event.id] ?? null;

  return (
    <article className="pt-24 md:pt-28 pb-20 px-5 md:px-8 max-w-[1100px] mx-auto">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-warm-grey hover:text-cocoa mb-6"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M13 8H3M7 4L3 8l4 4" />
        </svg>
        All events
      </Link>

      {(cancelled || finished) && (
        <div
          role="status"
          className={`mb-6 rounded-2xl px-5 py-4 text-[0.88rem] ${
            cancelled ? "bg-ember/10 border border-ember/25 text-cocoa" : "bg-sand/50 border border-sand text-warm-grey"
          }`}
        >
          {cancelled
            ? "This event has been cancelled. Anyone who had tickets has been refunded in full."
            : "This event has already taken place."}{" "}
          <Link href="/events" className="font-semibold text-gold hover:text-cocoa underline underline-offset-2">
            See what&apos;s coming up
          </Link>
        </div>
      )}

      {event.image_url && (
        <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden bg-sand mb-8">
          <Image
            src={event.image_url}
            alt=""
            fill
            priority
            className={`object-cover ${live ? "" : "grayscale-[40%] opacity-90"}`}
            sizes="(max-width: 1100px) 100vw, 1100px"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-x-14 gap-y-8">
        <header className="lg:col-start-1">
          <p className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-gold mb-3">
            <time dateTime={event.event_date}>{date.longWithYear}</time>
            {times && <> &middot; {times}</>}
          </p>
          <h1 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-normal text-cocoa leading-[1.05] mb-4 break-words">
            {event.title}
          </h1>
          {event.location && (
            <p className="flex items-center gap-2 text-[0.88rem] text-warm-grey mb-6">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              {event.location}
            </p>
          )}
        </header>

        <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-28 self-start">
          <div className="bg-white border border-sand rounded-2xl p-6">
            <p className="font-display text-xl font-semibold text-cocoa mb-1">{date.long}</p>
            <p className="text-[0.8rem] text-warm-grey mb-5">
              {times ?? "All day"}
              {event.location && <> &middot; {event.location}</>}
            </p>

            {live && event.tickets_enabled && eventAvailability ? (
              <EventTicketActions
                eventId={event.id}
                pricePence={event.price_pence}
                maxPerMember={event.max_tickets_per_member}
                salesOpenAt={event.sales_open_at}
                availability={eventAvailability}
                profileId={user?.id ?? null}
                member={member}
                returnPath={`/events/${event.slug}`}
              />
            ) : live && event.link_url ? (
              <a
                href={event.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase bg-cocoa text-wheat hover:bg-gold hover:text-cocoa transition-colors"
              >
                {event.link_label || "Find out more"}
              </a>
            ) : !live ? (
              <p className="text-[0.82rem] text-warm-grey">
                {cancelled ? "Tickets are no longer available." : "Tickets are no longer on sale."}
              </p>
            ) : event.tickets_enabled ? (
              <p className="text-[0.82rem] text-warm-grey">{formatPounds(event.price_pence)} per ticket</p>
            ) : (
              <p className="text-[0.82rem] text-warm-grey">No booking needed — just come along.</p>
            )}
          </div>
        </aside>

        <div className="lg:col-start-1">
          {event.description && (
            <div className="text-[0.98rem] text-slate leading-[1.75] whitespace-pre-line max-w-[62ch]">
              {event.description}
            </div>
          )}

          {!cancelled && (
            <div className="mt-10 pt-6 border-t border-sand">
              <p className="text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-gold mb-3">Share this event</p>
              <EventShare url={url} title={event.title} />
            </div>
          )}
        </div>

      </div>
    </article>
  );
}
