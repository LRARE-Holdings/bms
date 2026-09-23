import Image from "next/image";
import type { EventAvailability, EventMemberState, StudioEvent } from "@/lib/types";
import Link from "next/link";
import EventTicketActions from "@/components/events/event-ticket-actions";
import { eventDateParts, formatEventTimes } from "@/lib/event-format";

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
  const times = formatEventTimes(event);
  const href = `/events/${event.slug}`;

  return (
    <article className="h-full flex flex-col bg-white border border-sand rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_12px_40px_rgba(71,55,40,0.08)] hover:border-gold">
      <Link href={href} className="relative block aspect-[370/208] bg-sand overflow-hidden" aria-label={event.title}>
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
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-gold mb-1.5">
          <time dateTime={event.event_date}>{date.long}</time>
          {times && <> &middot; {times}</>}
        </p>
        <h3 className="font-display text-[1.5rem] font-semibold text-cocoa leading-tight mb-1">
          <Link href={href} className="hover:text-gold transition-colors">
            {event.title}
          </Link>
        </h3>
        {event.location && (
          <p className="text-[0.75rem] text-warm-grey mb-2">{event.location}</p>
        )}
        {event.description && (
          <p className="text-[0.85rem] text-warm-grey leading-relaxed whitespace-pre-line mt-1 line-clamp-3">
            {event.description}
          </p>
        )}
        <Link
          href={href}
          className="self-start mt-2 text-[0.72rem] font-semibold text-gold hover:text-cocoa underline underline-offset-2"
        >
          More details
        </Link>
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
              returnPath={href}
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
