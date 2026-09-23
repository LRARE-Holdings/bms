import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioId } from "@/lib/studio-context";
import { hasStartedUK } from "@/lib/date-utils";
import { getStudioStripeAccount } from "@/lib/stripe";
import { refundMemberPayment } from "@/lib/refunds";
import { offerEventWaitlist } from "@/lib/event-waitlist-offer";

const schema = z.object({ ticket_id: z.string().uuid() });

/**
 * POST /api/events/tickets/cancel
 *
 * A member cancels their own tickets. Same terms as a class: allowed any time
 * before it starts, refunded in full to the card, and the places go straight to
 * the waitlist if anyone is queueing. forma-admin's `charge.refunded` webhook
 * emails the refund confirmation.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const admin = createAdminClient();
  const { data: ticket } = await admin
    .from("event_tickets")
    .select("id, event_id, profile_id, status, stripe_payment_intent_id, refunded_at, events:event_id(event_date, start_time)")
    .eq("id", parsed.data.ticket_id)
    .eq("studio_id", await getStudioId())
    .single();

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.profile_id !== user.id) {
    return NextResponse.json({ error: "Not your ticket" }, { status: 403 });
  }
  if (ticket.status !== "confirmed") {
    return NextResponse.json({ error: "This ticket is already cancelled" }, { status: 400 });
  }

  const event = ticket.events as unknown as { event_date: string; start_time: string | null } | null;
  if (event && hasStartedUK(event.event_date, event.start_time)) {
    return NextResponse.json(
      { error: "This event has already started, so the tickets can't be cancelled." },
      { status: 400 }
    );
  }

  // Conditional on still being confirmed: of two simultaneous requests only
  // one cancels, and only that one refunds.
  const { data: cancelled, error } = await admin
    .from("event_tickets")
    .update({ status: "cancelled", cancelled_by: "member", cancelled_at: new Date().toISOString() })
    .eq("id", ticket.id)
    .eq("status", "confirmed")
    .select("id");
  if (error) {
    console.error("[events/tickets/cancel] update failed:", error);
    return NextResponse.json({ error: "Failed to cancel tickets" }, { status: 500 });
  }
  if (!cancelled || cancelled.length === 0) {
    return NextResponse.json({ error: "This ticket is already cancelled" }, { status: 400 });
  }

  let refundPence: number | null = null;
  let refundFailed = false;
  if (ticket.stripe_payment_intent_id && !ticket.refunded_at) {
    const stripeAccountId = await getStudioStripeAccount(await getStudioId());
    const refund = stripeAccountId
      ? await refundMemberPayment({
          stripeId: ticket.stripe_payment_intent_id,
          stripeAccountId,
          initiatedBy: "member_event_cancel",
          metadata: { event_ticket_id: ticket.id },
        })
      : { ok: false as const, reason: "studio has no connected Stripe account" };

    if (refund.ok) {
      refundPence = refund.amountPence;
      await admin
        .from("event_tickets")
        .update({ refunded_at: new Date().toISOString(), refund_amount_pence: refund.amountPence })
        .eq("id", ticket.id);
    } else {
      // The admin tickets page shows this ticket with a Refund button.
      refundFailed = true;
      console.error(`[events/tickets/cancel] Refund FAILED for ticket ${ticket.id}: ${refund.reason}. REFUND BY HAND.`);
    }
  }

  // Awaited so the call survives serverless teardown; it never throws.
  await offerEventWaitlist({ studioId: await getStudioId(), eventId: ticket.event_id });

  return NextResponse.json({ success: true, refundPence, refundFailed });
}
