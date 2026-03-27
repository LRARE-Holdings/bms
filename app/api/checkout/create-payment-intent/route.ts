import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createDropinPaymentIntent,
  createPackPaymentIntent,
} from "@/lib/checkout";
import { getStudioId } from "@/lib/studio-context";

const dropinSchema = z.object({
  type: z.literal("dropin"),
  schedule_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const packSchema = z.object({
  type: z.literal("pack"),
  tier_id: z.string().uuid(),
});

const schema = z.discriminatedUnion("type", [dropinSchema, packSchema]);

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
