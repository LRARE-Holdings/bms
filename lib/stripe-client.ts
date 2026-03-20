import { loadStripe, type Stripe } from "@stripe/stripe-js";

const stripePromises = new Map<string, Promise<Stripe | null>>();

/**
 * Load the client-side Stripe.js instance.
 * For Stripe Connect, pass the connected account ID so the
 * Payment Element renders in the context of the studio's account.
 */
export function getStripeClient(
  connectedAccountId?: string | null
): Promise<Stripe | null> {
  const key = connectedAccountId || "__platform__";

  if (!stripePromises.has(key)) {
    const promise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
    );
    stripePromises.set(key, promise);
  }

  return stripePromises.get(key)!;
}
