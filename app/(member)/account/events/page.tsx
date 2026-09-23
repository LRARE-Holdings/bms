export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, getStudioId } from "@/lib/auth";
import { ukDateStr } from "@/lib/date-utils";
import AccountHeader from "@/components/account/account-header";
import EventTicketList, { type EventTicketRow, type EventWaitlistRow } from "@/components/account/event-ticket-list";

export const metadata = {
  title: "My Events | Burn Mat Studio",
};

type EventJoin = {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  cancelled_at: string | null;
} | null;

export default async function MyEventsPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const studioId = await getStudioId();
  const today = ukDateStr();

  // RLS limits these to the member's own rows.
  const [{ data: tickets }, { data: waitlist }] = await Promise.all([
    supabase
      .from("event_tickets")
      .select("id, quantity, amount_pence, status, cancelled_by, refunded_at, events:event_id(id, title, event_date, start_time, end_time, location, cancelled_at)")
      .eq("profile_id", user.id)
      .eq("studio_id", studioId)
      .in("status", ["confirmed", "cancelled"])
      .order("created_at", { ascending: false }),
    supabase
      .from("event_waitlist")
      .select("id, quantity, status, expires_at, claim_token, events:event_id(id, title, event_date, start_time, end_time, location, cancelled_at)")
      .eq("profile_id", user.id)
      .eq("studio_id", studioId)
      .in("status", ["waiting", "offered"]),
  ]);

  const ticketRows: EventTicketRow[] = (tickets ?? [])
    .map((t) => ({ t, e: t.events as unknown as EventJoin }))
    .filter(({ e }) => !!e)
    .map(({ t, e }) => ({
      id: t.id,
      quantity: t.quantity,
      amountPence: t.amount_pence,
      status: t.status as "confirmed" | "cancelled",
      cancelledBy: t.cancelled_by,
      refunded: !!t.refunded_at,
      eventTitle: e!.title,
      eventDate: e!.event_date,
      startTime: e!.start_time,
      endTime: e!.end_time,
      location: e!.location,
      eventCancelled: !!e!.cancelled_at,
      upcoming: e!.event_date >= today,
    }))
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  const waitlistRows: EventWaitlistRow[] = (waitlist ?? [])
    .map((w) => ({ w, e: w.events as unknown as EventJoin }))
    .filter(({ w, e }) => !!e && e.event_date >= today && !e.cancelled_at
      && !(w.status === "offered" && new Date(w.expires_at) <= new Date()))
    .map(({ w, e }) => ({
      id: w.id,
      eventId: e!.id,
      eventTitle: e!.title,
      eventDate: e!.event_date,
      quantity: w.quantity,
      status: w.status as "waiting" | "offered",
      claimToken: w.claim_token,
    }));

  const empty = ticketRows.length === 0 && waitlistRows.length === 0;

  return (
    <section className="py-10 px-5 md:px-10 max-w-[760px]">
      <AccountHeader
        eyebrow="Events"
        title="My events"
        subtitle="Your event tickets and waitlist places."
      />
      {empty ? (
        <div className="bg-white border border-sand rounded-2xl p-8 text-center">
          <p className="text-[0.88rem] text-warm-grey mb-4">You haven&apos;t got tickets for any events yet.</p>
          <Link
            href="/#events"
            className="inline-block px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
          >
            See what&apos;s on
          </Link>
        </div>
      ) : (
        <EventTicketList tickets={ticketRows} waitlist={waitlistRows} />
      )}
    </section>
  );
}
