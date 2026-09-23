import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/uuid";
import { ukWallClockToDate } from "@/lib/date-utils";

/**
 * Everything a wallet pass shows, looked up by the ticket's wallet token (the
 * secret in the confirmation email's "Add to Wallet" links).
 */
export interface WalletTicket {
  ticketId: string;
  eventId: string;
  quantity: number;
  holderName: string;
  eventTitle: string;
  description: string;
  location: string | null;
  /** "Friday 9 October" */
  dateDisplay: string;
  /** "19:00–21:00", or null for an all-day event */
  timeDisplay: string | null;
  starts: Date;
  ends: Date;
  studioName: string;
  publicBaseUrl: string;
}

/** Null unless the token belongs to a confirmed ticket for a live event at this studio. */
export async function loadWalletTicket(token: string, studioId: string): Promise<WalletTicket | null> {
  if (!isUuid(token)) return null;

  const supabase = createAdminClient();
  const { data: ticket } = await supabase
    .from("event_tickets")
    .select(
      "id, quantity, status, profiles:profile_id(full_name), events:event_id(id, title, description, event_date, start_time, end_time, location, cancelled_at), studios:studio_id(name, domain)"
    )
    .eq("wallet_token", token)
    .eq("studio_id", studioId)
    .maybeSingle();

  if (!ticket || ticket.status !== "confirmed") return null;

  const event = ticket.events as unknown as {
    id: string;
    title: string;
    description: string;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    cancelled_at: string | null;
  } | null;
  if (!event || event.cancelled_at) return null;

  const profile = ticket.profiles as unknown as { full_name: string | null } | null;
  const studio = ticket.studios as unknown as { name: string; domain: string | null } | null;

  const startTime = event.start_time?.slice(0, 5) ?? null;
  const endTime = event.end_time?.slice(0, 5) ?? null;
  const starts = ukWallClockToDate(event.event_date, startTime ?? "00:00");
  const ends = endTime
    ? ukWallClockToDate(event.event_date, endTime)
    : ukWallClockToDate(event.event_date, "23:59");

  return {
    ticketId: ticket.id,
    eventId: event.id,
    quantity: ticket.quantity,
    holderName: profile?.full_name ?? "Ticket holder",
    eventTitle: event.title,
    description: event.description,
    location: event.location,
    dateDisplay: new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    timeDisplay: startTime ? (endTime ? `${startTime}–${endTime}` : startTime) : null,
    starts,
    ends,
    studioName: studio?.name ?? "Studio",
    publicBaseUrl: `https://${studio?.domain ?? "burnmatstudio.co.uk"}`,
  };
}

/** What the pass's QR code carries — for a door check-in screen later. */
export function ticketBarcode(ticketId: string): string {
  return `forma-ticket:${ticketId}`;
}

/** Short reference printed under the QR code and on the pass. */
export function ticketReference(ticketId: string): string {
  return ticketId.slice(0, 8).toUpperCase();
}
