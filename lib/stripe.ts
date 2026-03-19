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
 * Get or create a Stripe Customer for a user profile.
 * Lazily creates a customer on first purchase — avoids
 * creating Stripe Customers for users who never buy.
 */
export async function getOrCreateStripeCustomer({
  profileId,
  email,
  fullName,
}: {
  profileId: string;
  email: string;
  fullName: string | null;
}): Promise<string> {
  const supabase = createAdminClient();

  // Check for existing Stripe Customer
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", profileId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create a new Stripe Customer
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: fullName || undefined,
    metadata: { profile_id: profileId },
  });

  // Save back to profiles
  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", profileId);

  return customer.id;
}
