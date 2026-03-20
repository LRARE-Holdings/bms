import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createDropinPaymentIntent,
  createPackPaymentIntent,
} from "@/lib/checkout";
import { getStudioId } from "@/lib/studio-context";

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
  const { type, schedule_id, date, tier_id } = body;

  try {
    if (type === "dropin") {
      if (!schedule_id || !date) {
        return NextResponse.json(
          { error: "schedule_id and date are required for drop-in" },
          { status: 400 }
        );
      }

      const result = await createDropinPaymentIntent(
        user.id,
        schedule_id,
        date,
        studioId
      );

      return NextResponse.json(result);
    }

    if (type === "pack") {
      if (!tier_id) {
        return NextResponse.json(
          { error: "tier_id is required for pack purchase" },
          { status: 400 }
        );
      }

      const result = await createPackPaymentIntent(
        user.id,
        tier_id,
        studioId
      );

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "type must be 'dropin' or 'pack'" },
      { status: 400 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
