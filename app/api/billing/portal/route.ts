import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getStudioStripeAccount } from "@/lib/stripe";
import { getStudioId } from "@/lib/studio-context";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const studioId = await getStudioId();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Look up user's Stripe Customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing history found" },
        { status: 404 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://burnmatstudio.co.uk";

    const stripeAccountId = await getStudioStripeAccount(studioId);

    const portalSession = await getStripe().billingPortal.sessions.create(
      {
        customer: profile.stripe_customer_id,
        return_url: `${origin}/account/billing`,
      },
      stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Billing portal error:", err);
    const message = err instanceof Error ? err.message : "Failed to open billing portal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
