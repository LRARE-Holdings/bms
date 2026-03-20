import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * Look up the connected Stripe account ID for a studio.
 * Returns null if the studio has no connected account.
 */
export async function getStudioStripeAccount(
  studioId: string
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("studios")
    .select("stripe_account_id")
    .eq("id", studioId)
    .single();

  return data?.stripe_account_id ?? null;
}

/**
 * Get or create a Stripe Customer for a user profile.
 * For Stripe Connect Standard accounts, the customer is created
 * on the connected account so they can pay the studio directly.
 */
export async function getOrCreateStripeCustomer({
  profileId,
  email,
  fullName,
  stripeAccountId,
}: {
  profileId: string;
  email: string;
  fullName: string | null;
  stripeAccountId?: string | null;
}): Promise<string> {
  const supabase = createAdminClient();
  const stripe = getStripe();
  const stripeOpts = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : undefined;

  // Check for existing Stripe Customer stored on the profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", profileId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create a new Stripe Customer (on the connected account if applicable)
  const customer = await stripe.customers.create(
    {
      email,
      name: fullName || undefined,
      metadata: { profile_id: profileId },
    },
    stripeOpts
  );

  // Save back to profiles
  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", profileId);

  return customer.id;
}
