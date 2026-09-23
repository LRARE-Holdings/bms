import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

export type RefundOutcome =
  | { ok: true; amountPence: number }
  | { ok: false; reason: string };

/**
 * Refund a card payment in full on the studio's connected account, when a
 * member cancels before the class or event starts.
 *
 * `initiatedBy` is read by forma-admin's `charge.refunded` webhook:
 *   member_cancel        — class booking; the cancellation email already
 *                          states the refund, so the webhook sends nothing.
 *   member_event_cancel  — event tickets; the webhook's refund email is the
 *                          member's confirmation.
 *
 * The stored id is a PaymentIntent (`pi_`, the Elements flow) or, for old
 * bookings, a Checkout Session (`cs_`). Never throws.
 */
export async function refundMemberPayment(params: {
  stripeId: string;
  stripeAccountId: string;
  initiatedBy: "member_cancel" | "member_event_cancel";
  metadata?: Record<string, string>;
}): Promise<RefundOutcome> {
  const stripe = getStripe();
  const opts = { stripeAccount: params.stripeAccountId };

  try {
    let paymentIntentId: string | null = null;
    if (params.stripeId.startsWith("pi_")) {
      paymentIntentId = params.stripeId;
    } else if (params.stripeId.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(params.stripeId, opts);
      paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;
    }
    if (!paymentIntentId) return { ok: false, reason: "No payment intent on this payment" };

    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        metadata: { initiated_by: params.initiatedBy, ...params.metadata },
      },
      opts
    );
    return { ok: true, amountPence: refund.amount };
  } catch (err) {
    const e = err as Stripe.errors.StripeError;
    // Already refunded (e.g. a double click): nothing more to pay out.
    if (e.code === "charge_already_refunded") return { ok: true, amountPence: 0 };
    return { ok: false, reason: e.message ?? "Stripe refund failed" };
  }
}
