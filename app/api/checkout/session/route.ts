import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const studioId = process.env.NEXT_PUBLIC_STUDIO_ID!;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { schedule_id, date } = await request.json();
  if (!schedule_id || !date) {
    return NextResponse.json(
      { error: "schedule_id and date are required" },
      { status: 400 }
    );
  }

  // Look up the class via the schedule slot and the user's profile
  const [{ data: slot, error }, { data: profile }] = await Promise.all([
    supabase
      .from("schedule")
      .select("id, classes(name, price_pence)")
      .eq("id", schedule_id)
      .eq("studio_id", studioId)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single(),
  ]);

  if (error || !slot) {
    return NextResponse.json({ error: "Schedule slot not found" }, { status: 404 });
  }

  const cls = slot.classes as unknown as { name: string; price_pence: number };

  // Get or create Stripe Customer for this user
  const stripeCustomerId = await getOrCreateStripeCustomer({
    profileId: user.id,
    email: profile?.email || user.email || "",
    fullName: profile?.full_name || null,
  });

  const origin = request.headers.get("origin") || "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: { name: cls.name },
          unit_amount: cls.price_pence,
        },
        quantity: 1,
      },
    ],
    metadata: {
      schedule_id,
      date,
      profile_id: user.id,
      studio_id: studioId,
    },
    success_url: `${origin}/account?booking=success`,
    cancel_url: `${origin}/account`,
  });

  return NextResponse.json({ url: session.url });
}
