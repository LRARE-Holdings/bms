import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMembershipSubscription } from "@/lib/checkout";
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

  const { tier_id } = await request.json();
  if (!tier_id) {
    return NextResponse.json(
      { error: "tier_id is required" },
      { status: 400 }
    );
  }

  try {
    const result = await createMembershipSubscription(
      user.id,
      tier_id,
      studioId
    );

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create subscription";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
