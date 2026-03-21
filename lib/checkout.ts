import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getStripe,
  getStudioStripeAccount,
  getOrCreateStripeCustomer,
} from "@/lib/stripe";
import { isBookingClosed, getBookingCount, getClassCapacity } from "@/lib/booking-helpers";

interface CheckoutResult {
  clientSecret: string;
  stripeAccountId: string | null;
  displayData: {
    name: string;
    pricePounds: string;
    description: string;
  };
}

interface SubscriptionResult extends CheckoutResult {
  subscriptionId: string;
}

/**
 * Create a PaymentIntent for a drop-in class booking.
 */
export async function createDropinPaymentIntent(
  userId: string,
  scheduleId: string,
  date: string,
  studioId: string
): Promise<CheckoutResult> {
  const supabase = createAdminClient();
  const stripe = getStripe();

  // Fetch schedule + class details
  const { data: slot, error: slotError } = await supabase
    .from("schedule")
    .select("id, start_time, classes(id, name, price_pence, stripe_price_id, duration_mins)")
    .eq("id", scheduleId)
    .eq("studio_id", studioId)
    .single();

  if (slotError || !slot) {
    throw new Error("Schedule slot not found");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cls = Array.isArray(slot.classes) ? slot.classes[0] : (slot.classes as any);
  if (!cls) throw new Error("Class not found for this schedule slot");

  // Validate booking cutoff (30 min before class)
  if (isBookingClosed(slot.start_time, date)) {
    throw new Error("Bookings close 30 minutes before class starts");
  }

  // Check class not full — use DB-sourced capacity
  const [bookingCount, maxCapacity] = await Promise.all([
    getBookingCount(supabase, scheduleId, date, studioId),
    getClassCapacity(studioId, cls.id),
  ]);

  if (bookingCount >= maxCapacity) {
    throw new Error("Class is full");
  }

  // Check no duplicate booking
  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("schedule_id", scheduleId)
    .eq("profile_id", userId)
    .eq("date", date)
    .eq("status", "confirmed")
    .single();

  if (existing) {
    throw new Error("You already have a booking for this class");
  }

  // Get studio's connected Stripe account
  const stripeAccountId = await getStudioStripeAccount(studioId);
  const stripeOpts = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : undefined;

  // Get or create Stripe customer
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

  // Create PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: cls.price_pence,
      currency: "gbp",
      customer: customerId,
      metadata: {
        type: "drop_in_class",
        schedule_id: scheduleId,
        date,
        profile_id: userId,
        studio_id: studioId,
      },
      automatic_payment_methods: { enabled: true },
    },
    stripeOpts
  );

  if (!paymentIntent.client_secret) {
    throw new Error("Failed to create payment intent");
  }

  return {
    clientSecret: paymentIntent.client_secret,
    stripeAccountId,
    displayData: {
      name: cls.name,
      pricePounds: (cls.price_pence / 100).toFixed(2),
      description: `${cls.duration_mins} min class`,
    },
  };
}

/**
 * Create a PaymentIntent for a waitlist claim (drop-in).
 * Skips capacity check since the spot is held for the claimant.
 * Includes waitlist claim_token in metadata so the webhook can mark the entry as claimed.
 */
export async function createWaitlistClaimPaymentIntent(
  userId: string,
  scheduleId: string,
  date: string,
  studioId: string,
  claimToken: string
): Promise<CheckoutResult> {
  const supabase = createAdminClient();
  const stripe = getStripe();

  // Validate the waitlist entry
  const { data: waitlistEntry } = await supabase
    .from("waitlist")
    .select("id, status, expires_at")
    .eq("claim_token", claimToken)
    .eq("studio_id", studioId)
    .eq("profile_id", userId)
    .single();

  if (!waitlistEntry || waitlistEntry.status !== "offered") {
    throw new Error("This waitlist offer is no longer valid");
  }

  if (!waitlistEntry.expires_at || new Date(waitlistEntry.expires_at) <= new Date()) {
    throw new Error("This waitlist offer has expired");
  }

  // Fetch schedule + class details
  const { data: slot, error: slotError } = await supabase
    .from("schedule")
    .select("id, start_time, classes(id, name, price_pence, stripe_price_id, duration_mins)")
    .eq("id", scheduleId)
    .eq("studio_id", studioId)
    .single();

  if (slotError || !slot) {
    throw new Error("Schedule slot not found");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cls = Array.isArray(slot.classes) ? slot.classes[0] : (slot.classes as any);
  if (!cls) throw new Error("Class not found for this schedule slot");

  // No capacity check — spot is held for the claimant

  // Check no duplicate booking
  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("schedule_id", scheduleId)
    .eq("profile_id", userId)
    .eq("date", date)
    .eq("status", "confirmed")
    .single();

  if (existing) {
    throw new Error("You already have a booking for this class");
  }

  // Get studio's connected Stripe account
  const stripeAccountId = await getStudioStripeAccount(studioId);
  const stripeOpts = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : undefined;

  // Get or create Stripe customer
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

  // Create PaymentIntent with waitlist claim token in metadata
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: cls.price_pence,
      currency: "gbp",
      customer: customerId,
      metadata: {
        type: "waitlist_claim",
        schedule_id: scheduleId,
        date,
        profile_id: userId,
        studio_id: studioId,
        waitlist_claim_token: claimToken,
      },
      automatic_payment_methods: { enabled: true },
    },
    stripeOpts
  );

  if (!paymentIntent.client_secret) {
    throw new Error("Failed to create payment intent");
  }

  return {
    clientSecret: paymentIntent.client_secret,
    stripeAccountId,
    displayData: {
      name: cls.name,
      pricePounds: (cls.price_pence / 100).toFixed(2),
      description: `${cls.duration_mins} min class (waitlist claim)`,
    },
  };
}

/**
 * Create a PaymentIntent for a class pack purchase.
 */
export async function createPackPaymentIntent(
  userId: string,
  tierId: string,
  studioId: string
): Promise<CheckoutResult> {
  const supabase = createAdminClient();
  const stripe = getStripe();

  // Fetch pack tier
  const { data: tier, error: tierError } = await supabase
    .from("pack_tiers")
    .select("*")
    .eq("id", tierId)
    .eq("studio_id", studioId)
    .eq("is_active", true)
    .single();

  if (tierError || !tier) {
    throw new Error("Pack tier not found or inactive");
  }

  // Get studio's connected Stripe account
  const stripeAccountId = await getStudioStripeAccount(studioId);
  const stripeOpts = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : undefined;

  // Get or create Stripe customer
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

  // Create PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: tier.price_pence,
      currency: "gbp",
      customer: customerId,
      metadata: {
        type: "pack_tier",
        pack_tier_id: tierId,
        profile_id: userId,
        studio_id: studioId,
      },
      automatic_payment_methods: { enabled: true },
    },
    stripeOpts
  );

  if (!paymentIntent.client_secret) {
    throw new Error("Failed to create payment intent");
  }

  const perClassPounds = (tier.price_pence / tier.credits / 100).toFixed(2);

  return {
    clientSecret: paymentIntent.client_secret,
    stripeAccountId,
    displayData: {
      name: tier.name,
      pricePounds: (tier.price_pence / 100).toFixed(2),
      description: `${tier.credits} credits \u00b7 \u00a3${perClassPounds} per class`,
    },
  };
}

/**
 * Create a Stripe Subscription for a membership purchase.
 */
export async function createMembershipSubscription(
  userId: string,
  tierId: string,
  studioId: string
): Promise<SubscriptionResult> {
  const supabase = createAdminClient();
  const stripe = getStripe();

  // Fetch membership tier
  const { data: tier, error: tierError } = await supabase
    .from("membership_tiers")
    .select("*")
    .eq("id", tierId)
    .eq("studio_id", studioId)
    .eq("is_active", true)
    .single();

  if (tierError || !tier) {
    throw new Error("Membership tier not found or inactive");
  }

  if (!tier.stripe_price_id) {
    throw new Error("Membership tier is not configured for payments");
  }

  // Get studio's connected Stripe account
  const stripeAccountId = await getStudioStripeAccount(studioId);
  const stripeOpts = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : undefined;

  // Get or create Stripe customer
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

  // Create Subscription (incomplete — requires payment confirmation via Elements)
  const subscription = await stripe.subscriptions.create(
    {
      customer: customerId,
      items: [{ price: tier.stripe_price_id }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        type: "membership",
        membership_tier_id: tierId,
        profile_id: userId,
        studio_id: studioId,
      },
    },
    stripeOpts
  );

  // Extract client secret from the subscription's first invoice payment intent
  // The expand parameter makes latest_invoice a full Invoice object with payment_intent expanded
  const invoice = subscription.latest_invoice as Stripe.Invoice | null;
  if (!invoice || typeof invoice === "string") {
    throw new Error("Failed to create subscription payment");
  }

  // With expand: ["latest_invoice.payment_intent"], payment_intent is a full PaymentIntent object
  const paymentIntent = (invoice as unknown as { payment_intent: Stripe.PaymentIntent | string | null }).payment_intent;
  if (!paymentIntent || typeof paymentIntent === "string") {
    throw new Error("Failed to create subscription payment");
  }

  const clientSecret = paymentIntent.client_secret;
  if (!clientSecret) {
    throw new Error("Failed to get payment client secret");
  }

  const intervalLabel =
    tier.interval_count > 1
      ? `every ${tier.interval_count} ${tier.interval}s`
      : `per ${tier.interval}`;

  return {
    clientSecret,
    subscriptionId: subscription.id,
    stripeAccountId,
    displayData: {
      name: tier.name,
      pricePounds: (tier.price_pence / 100).toFixed(2),
      description: `${tier.description || `Membership \u00b7 \u00a3${(tier.price_pence / 100).toFixed(2)} ${intervalLabel}`}`,
    },
  };
}
