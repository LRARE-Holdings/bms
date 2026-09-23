import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createDropinPaymentIntent,
  createPackPaymentIntent,
  createWaitlistClaimPaymentIntent,
} from "@/lib/checkout";
import { getStudioId } from "@/lib/studio-context";
import { createEventTicketPaymentIntent } from "@/lib/event-tickets";

const dropinSchema = z.object({
  type: z.literal("dropin"),
  schedule_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const packSchema = z.object({
  type: z.literal("pack"),
  tier_id: z.string().uuid(),
});

const waitlistClaimSchema = z.object({
  type: z.literal("waitlist_claim"),
  schedule_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  waitlist_token: z.string(),
});

const eventTicketSchema = z.object({
  type: z.literal("event_ticket"),
  event_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  // Present when claiming a waitlist offer; the quantity then comes from the offer.
  claim_token: z.string().uuid().optional(),
});

const schema = z.discriminatedUnion("type", [
  dropinSchema,
  packSchema,
  waitlistClaimSchema,
  eventTicketSchema,
]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const studioId = await getStudioId();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.type === "dropin") {
      const { schedule_id, date } = parsed.data;

      const result = await createDropinPaymentIntent(
        user.id,
        schedule_id,
        date,
        studioId
      );

      return NextResponse.json(result);
    }

    if (parsed.data.type === "pack") {
      const result = await createPackPaymentIntent(
        user.id,
        parsed.data.tier_id,
        studioId
      );

      return NextResponse.json(result);
    }

    if (parsed.data.type === "waitlist_claim") {
      const { schedule_id, date, waitlist_token } = parsed.data;

      const result = await createWaitlistClaimPaymentIntent(
        user.id,
        schedule_id,
        date,
        studioId,
        waitlist_token
      );

      return NextResponse.json(result);
    }

    if (parsed.data.type === "event_ticket") {
      const result = await createEventTicketPaymentIntent({
        userId: user.id,
        studioId,
        eventId: parsed.data.event_id,
        quantity: parsed.data.quantity,
        claimToken: parsed.data.claim_token,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid payment type" },
      { status: 400 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
