import { createAdminClient } from "@/lib/supabase/admin";
import {
  getStripe,
  getStudioStripeAccount,
  getOrCreateStripeCustomer,
} from "@/lib/stripe";
import type { EventAvailability, EventMemberState, StudioEvent } from "@/lib/types";

/**
 * Event tickets on the public site.
 *
 * Whether someone may buy is decided in the database, under a lock on the
 * event (reserve_event_tickets — see forma-admin's 20260923_01 migration), so
 * two people can never be sold the last place. This module turns the answer
 * into a PaymentIntent, and reads what the page needs to show.
 */

const RESERVE_ERRORS: Record<string, string> = {
  not_on_sale: "Tickets for this event aren't on sale.",
  event_passed: "This event has already taken place.",
  not_open_yet: "Tickets aren't on sale yet.",
  offer_invalid: "This waitlist offer has expired or has already been used.",
  invalid_quantity: "That number of tickets isn't available.",
  sold_out: "Sorry, this event has sold out. You can join the waitlist.",
  limit_reached: "You already have the maximum number of tickets for this event.",
};

interface EventCheckoutResult {
  clientSecret: string;
  stripeAccountId: string | null;
  ticketId: string;
  displayData: { name: string; pricePounds: string; description: string };
}

export async function createEventTicketPaymentIntent(params: {
  userId: string;
  studioId: string;
  eventId: string;
  quantity: number;
  claimToken?: string;
}): Promise<EventCheckoutResult> {
  const { userId, studioId, eventId, quantity, claimToken } = params;
  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, studio_id")
    .eq("id", eventId)
    .eq("studio_id", studioId)
    .single();
  if (!event) throw new Error("Event not found");

  // Tickets are always paid to the studio's own Stripe account.
  const stripeAccountId = await getStudioStripeAccount(studioId);
  if (!stripeAccountId) throw new Error("This studio isn't taking card payments yet.");

  const { data: reserved, error } = await supabase.rpc("reserve_event_tickets", {
    p_event_id: eventId,
    p_profile_id: userId,
    p_quantity: quantity,
    p_claim_token: claimToken ?? null,
  });
  if (error) throw new Error("Could not reserve tickets. Please try again.");
  if (!reserved?.ok) {
    throw new Error(RESERVE_ERRORS[reserved?.error as string] ?? "Tickets aren't available right now.");
  }

  const ticketId = reserved.ticket_id as string;
  const heldQuantity = reserved.quantity as number;
  const amountPence = reserved.amount_pence as number;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    const customerId = await getOrCreateStripeCustomer({
      profileId: userId,
      email: profile?.email || "",
      fullName: profile?.full_name || null,
      stripeAccountId,
    });

    const paymentIntent = await getStripe().paymentIntents.create(
      {
        amount: amountPence,
        currency: "gbp",
        customer: customerId,
        receipt_email: profile?.email || undefined,
        description: `${heldQuantity} × ${event.title}`,
        metadata: {
          type: "event_ticket",
          event_ticket_id: ticketId,
          event_id: eventId,
          profile_id: userId,
          studio_id: studioId,
        },
        automatic_payment_methods: { enabled: true },
      },
      // One PaymentIntent per hold, however many times the request is retried.
      { stripeAccount: stripeAccountId, idempotencyKey: `event-ticket-${ticketId}` }
    );

    if (!paymentIntent.client_secret) throw new Error("Failed to create payment");

    await supabase
      .from("event_tickets")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", ticketId);

    return {
      clientSecret: paymentIntent.client_secret,
      stripeAccountId,
      ticketId,
      displayData: {
        name: event.title,
        pricePounds: (amountPence / 100).toFixed(2),
        description: `${heldQuantity} ticket${heldQuantity === 1 ? "" : "s"} · held for you for 10 minutes`,
      },
    };
  } catch (err) {
    // Give the places straight back rather than holding them for ten minutes.
    await supabase.from("event_tickets").update({ status: "expired" }).eq("id", ticketId).eq("status", "pending");
    throw err;
  }
}

/** Places left and queue state for each ticketed event, keyed by event id. */
export async function getEventAvailability(
  eventIds: string[]
): Promise<Record<string, EventAvailability>> {
  if (eventIds.length === 0) return {};
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("event_availability", { p_event_ids: eventIds });
  const out: Record<string, EventAvailability> = {};
  for (const row of (data ?? []) as { event_id: string; places_left: number; queue_open: boolean }[]) {
    out[row.event_id] = { placesLeft: row.places_left, queueOpen: row.queue_open };
  }
  return out;
}

/** What this member already holds for each event, keyed by event id. */
export async function getEventMemberState(
  profileId: string,
  eventIds: string[]
): Promise<Record<string, EventMemberState>> {
  const out: Record<string, EventMemberState> = {};
  for (const id of eventIds) out[id] = { ticketsHeld: 0, waitlist: null, alertRequested: false };
  if (eventIds.length === 0) return out;

  const supabase = createAdminClient();
  const [{ data: tickets }, { data: waitlist }, { data: alerts }] = await Promise.all([
    supabase
      .from("event_tickets")
      .select("event_id, quantity")
      .eq("profile_id", profileId)
      .eq("status", "confirmed")
      .in("event_id", eventIds),
    supabase
      .from("event_waitlist")
      .select("event_id, status, quantity, claim_token, expires_at")
      .eq("profile_id", profileId)
      .in("status", ["waiting", "offered"])
      .in("event_id", eventIds),
    supabase
      .from("event_sale_alerts")
      .select("event_id")
      .eq("profile_id", profileId)
      .in("event_id", eventIds),
  ]);

  for (const t of tickets ?? []) out[t.event_id].ticketsHeld += t.quantity;
  for (const w of waitlist ?? []) {
    // A lapsed offer is gone; the job marks it expired within the minute.
    if (w.status === "offered" && new Date(w.expires_at) <= new Date()) continue;
    out[w.event_id].waitlist = {
      status: w.status,
      quantity: w.quantity,
      claimToken: w.claim_token,
    };
  }
  for (const a of alerts ?? []) out[a.event_id].alertRequested = true;
  return out;
}

export function salesOpen(event: Pick<StudioEvent, "sales_open_at">): boolean {
  return !event.sales_open_at || new Date(event.sales_open_at) <= new Date();
}

export function formatPounds(pence: number): string {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}
