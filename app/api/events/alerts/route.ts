import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioId } from "@/lib/studio-context";

const schema = z.object({ event_id: z.string().uuid() });

/**
 * POST   /api/events/alerts — email me when this event's tickets go on sale
 * DELETE /api/events/alerts — never mind
 *
 * The email itself is sent by forma-admin's every-minute event job.
 */
export async function POST(request: NextRequest) {
  const ctx = await authorise(request);
  if ("response" in ctx) return ctx.response;

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, sales_open_at, tickets_enabled, is_published, cancelled_at")
    .eq("id", ctx.eventId)
    .eq("studio_id", ctx.studioId)
    .single();

  if (!event || !event.is_published || !event.tickets_enabled || event.cancelled_at) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (!event.sales_open_at || new Date(event.sales_open_at) <= new Date()) {
    return NextResponse.json({ error: "Tickets are already on sale." }, { status: 400 });
  }

  const { error } = await admin
    .from("event_sale_alerts")
    .upsert(
      { studio_id: ctx.studioId, event_id: ctx.eventId, profile_id: ctx.userId },
      { onConflict: "event_id,profile_id", ignoreDuplicates: true }
    );
  if (error) {
    console.error("[events/alerts] insert failed:", error);
    return NextResponse.json({ error: "Could not save your request" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const ctx = await authorise(request);
  if ("response" in ctx) return ctx.response;

  await createAdminClient()
    .from("event_sale_alerts")
    .delete()
    .eq("event_id", ctx.eventId)
    .eq("profile_id", ctx.userId)
    .is("notified_at", null);
  return NextResponse.json({ success: true });
}

async function authorise(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return { response: NextResponse.json({ error: "Invalid input" }, { status: 400 }) };
  }
  return { userId: user.id, eventId: parsed.data.event_id, studioId: await getStudioId() };
}
