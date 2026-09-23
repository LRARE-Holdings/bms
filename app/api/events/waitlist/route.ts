import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioId } from "@/lib/studio-context";
import { offerEventWaitlist } from "@/lib/event-waitlist-offer";

const joinSchema = z.object({
  event_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});
const leaveSchema = z.object({ event_id: z.string().uuid() });

const JOIN_ERRORS: Record<string, string> = {
  not_on_sale: "This event isn't taking a waitlist.",
  not_open_yet: "Tickets aren't on sale yet.",
  invalid_quantity: "That number of tickets isn't available.",
  limit_reached: "You already have the maximum number of tickets for this event.",
  available: "Good news — tickets are available now, so you can buy them directly.",
  already_waiting: "You're already on the waitlist for this event.",
};

/**
 * POST   /api/events/waitlist — join the queue for a sold-out event
 * DELETE /api/events/waitlist — leave it (or turn down an offer)
 *
 * When places free up, forma-admin's event job offers them in order and emails
 * a claim link; see offer_event_waitlist().
 */
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = joinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const studioId = await getStudioId();
  const admin = createAdminClient();

  // The function checks everything else; this keeps it to this studio's events.
  const { data: event } = await admin
    .from("events")
    .select("id")
    .eq("id", parsed.data.event_id)
    .eq("studio_id", studioId)
    .maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data: result, error } = await admin.rpc("join_event_waitlist", {
    p_event_id: parsed.data.event_id,
    p_profile_id: user.id,
    p_quantity: parsed.data.quantity,
  });
  if (error) {
    console.error("[events/waitlist] join failed:", error);
    return NextResponse.json({ error: "Could not join the waitlist" }, { status: 500 });
  }
  if (!result?.ok) {
    return NextResponse.json(
      { error: JOIN_ERRORS[result?.error as string] ?? "Could not join the waitlist" },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = leaveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const studioId = await getStudioId();
  const { data: left } = await createAdminClient()
    .from("event_waitlist")
    .update({ status: "removed" })
    .eq("event_id", parsed.data.event_id)
    .eq("profile_id", user.id)
    .eq("studio_id", studioId)
    .in("status", ["waiting", "offered"])
    .select("status");

  // Turning down an offer releases the places it was holding: pass them on now.
  // Harmless if they were only waiting — nothing is freed, so nothing is offered.
  if (left && left.length > 0) {
    await offerEventWaitlist({ studioId, eventId: parsed.data.event_id });
  }

  return NextResponse.json({ success: true });
}

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
