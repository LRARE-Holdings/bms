import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";

const PACK_CONFIG = {
  "5": { price: 3750, label: "5 Class Pack" },
  "10": { price: 7500, label: "10 Class Pack" },
} as const;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const studioId = process.env.NEXT_PUBLIC_STUDIO_ID!;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { pack_type } = await request.json();
  if (!pack_type || !(pack_type in PACK_CONFIG)) {
    return NextResponse.json(
      { error: "pack_type must be '5' or '10'" },
      { status: 400 }
    );
  }

  // Fetch user profile for Stripe Customer creation
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  // Get or create Stripe Customer for this user
  const stripeCustomerId = await getOrCreateStripeCustomer({
    profileId: user.id,
    email: profile?.email || user.email || "",
    fullName: profile?.full_name || null,
  });

  const config = PACK_CONFIG[pack_type as keyof typeof PACK_CONFIG];
  const origin = request.headers.get("origin") || "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: { name: config.label },
          unit_amount: config.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      pack_type,
      profile_id: user.id,
      studio_id: studioId,
    },
    success_url: `${origin}/account?pack=success`,
    cancel_url: `${origin}/account/packs`,
  });

  return NextResponse.json({ url: session.url });
}
