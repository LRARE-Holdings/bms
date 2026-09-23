import Image from "next/image";
import type { EventAvailability, EventMemberState, StudioEvent } from "@/lib/types";
import EventTicketActions from "@/components/events/event-ticket-actions";

function eventDateParts(eventDate: string) {
  // Parsed as a local date on purpose: it is a UK calendar date, not an instant.
  const d = new Date(`${eventDate}T00:00:00`);
  return {
    weekday: d.toLocaleDateString("en-GB", { weekday: "short" }),
    day: d.getDate(),
    month: d.toLocaleDateString("en-GB", { month: "short" }),
    long: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
  };
}

function formatTimes(event: StudioEvent): string | null {
  if (!event.start_time) return null;
  const start = event.start_time.slice(0, 5);
  return event.end_time ? `${start} – ${event.end_time.slice(0, 5)}` : start;
}

export default function EventCard({
  event,
  availability,
  profileId,
  member,
}: {
  event: StudioEvent;
  /** Present for ticketed events */
  availability?: EventAvailability;
  profileId: string | null;
  member: EventMemberState | null;
}) {
  const date = eventDateParts(event.event_date);
  const times = formatTimes(event);

  return (
    <article className="h-full flex flex-col bg-white border border-sand rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_12px_40px_rgba(71,55,40,0.08)] hover:border-gold">
      <div className="relative aspect-[370/208] bg-sand overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cocoa to-cocoa/80" />
        )}

        {/* Date badge */}
        <div className="absolute top-3 left-3 bg-cream/95 rounded-xl px-3 py-2 text-center shadow-sm min-w-[3.5rem]">
          <span className="block text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-gold">
            {date.weekday}
          </span>
          <span className="block font-display text-2xl leading-none text-cocoa my-0.5">
            {date.day}
          </span>
          <span className="block text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-warm-grey">
            {date.month}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-gold mb-1.5">
          <time dateTime={event.event_date}>{date.long}</time>
          {times && <> &middot; {times}</>}
        </p>
        <h3 className="font-display text-[1.5rem] font-semibold text-cocoa leading-tight mb-1">
          {event.title}
        </h3>
        {event.location && (
          <p className="text-[0.75rem] text-warm-grey mb-2">{event.location}</p>
        )}
        {event.description && (
          <p className="text-[0.85rem] text-warm-grey leading-relaxed whitespace-pre-line mt-1">
            {event.description}
          </p>
        )}
        {event.tickets_enabled && availability && (
          <div className="mt-auto pt-5">
            <EventTicketActions
              eventId={event.id}
              pricePence={event.price_pence}
              maxPerMember={event.max_tickets_per_member}
              salesOpenAt={event.sales_open_at}
              availability={availability}
              profileId={profileId}
              member={member}
            />
          </div>
        )}
        {!event.tickets_enabled && event.link_url && (
          <a
            href={event.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto pt-5 self-start"
          >
            <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase bg-cocoa text-wheat hover:bg-gold hover:text-cocoa transition-colors">
              {event.link_label || "Find out more"}
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </span>
          </a>
        )}
      </div>
    </article>
  );
}
