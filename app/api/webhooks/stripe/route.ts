import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendBookingConfirmation,
  sendPackConfirmation,
} from "@/lib/email/send";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    const supabase = createAdminClient();

    if (metadata.schedule_id) {
      // Validate required metadata for drop-in booking
      if (!metadata.studio_id || !metadata.profile_id || !metadata.date) {
        console.error("Missing required booking metadata:", {
          session_id: session.id,
          has_studio_id: !!metadata.studio_id,
          has_profile_id: !!metadata.profile_id,
          has_date: !!metadata.date,
        });
        return NextResponse.json(
          { error: "Missing required metadata" },
          { status: 400 }
        );
      }

      // Idempotency: check if booking already exists
      const { data: existing } = await supabase
        .from("bookings")
        .select("id")
        .eq("stripe_session_id", session.id)
        .single();

      if (!existing) {
        const { error } = await supabase.from("bookings").insert({
          studio_id: metadata.studio_id,
          schedule_id: metadata.schedule_id,
          profile_id: metadata.profile_id,
          date: metadata.date,
          status: "confirmed",
          payment_method: "stripe",
          stripe_session_id: session.id,
        });

        if (error) {
          console.error("Failed to create booking:", error);
          return NextResponse.json(
            { error: "Failed to process booking" },
            { status: 500 }
          );
        }

        sendBookingConfirmation({
          profileId: metadata.profile_id,
          studioId: metadata.studio_id,
          scheduleId: metadata.schedule_id,
          date: metadata.date,
          paymentMethod: "stripe",
        });
      }
    } else if (metadata.pack_type) {
      // Validate required metadata for pack purchase
      if (!metadata.studio_id || !metadata.profile_id) {
        console.error("Missing required pack metadata:", {
          session_id: session.id,
          has_studio_id: !!metadata.studio_id,
          has_profile_id: !!metadata.profile_id,
        });
        return NextResponse.json(
          { error: "Missing required metadata" },
          { status: 400 }
        );
      }

      // Idempotency: check if pack already exists
      const { data: existing } = await supabase
        .from("class_packs")
        .select("id")
        .eq("stripe_session_id", session.id)
        .single();

      if (!existing) {
        const creditsTotal = metadata.pack_type === "10" ? 10 : 5;
        const weeksValid = metadata.pack_type === "10" ? 6 : 4;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + weeksValid * 7);

        const { error } = await supabase.from("class_packs").insert({
          studio_id: metadata.studio_id,
          profile_id: metadata.profile_id,
          pack_type: metadata.pack_type,
          credits_total: creditsTotal,
          credits_remaining: creditsTotal,
          purchased_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          stripe_session_id: session.id,
        });

        if (error) {
          console.error("Failed to create class pack:", error);
          return NextResponse.json(
            { error: "Failed to process pack purchase" },
            { status: 500 }
          );
        }

        sendPackConfirmation({
          profileId: metadata.profile_id,
          studioId: metadata.studio_id,
          packType: metadata.pack_type,
          credits: creditsTotal,
          expiresAt: expiresAt.toISOString(),
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
