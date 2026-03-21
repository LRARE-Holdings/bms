import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmation } from "@/lib/email/send";
import { getStudioId } from "@/lib/studio-context";
import { decrementPackCredit } from "@/lib/booking-helpers";

const schema = z.object({
  token: z.string().uuid(),
  payment_method: z.enum(["membership", "pack_credit"]),
});

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const studioId = await getStudioId();

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { token, payment_method } = parsed.data;

  // Look up waitlist entry by claim_token
  const { data: entry, error: fetchError } = await supabase
    .from("waitlist")
    .select("id, studio_id, schedule_id, date, profile_id, status, expires_at")
    .eq("claim_token", token)
    .eq("studio_id", studioId)
    .single();

  if (fetchError || !entry) {
    return NextResponse.json(
      { error: "Invalid or expired waitlist link" },
      { status: 404 }
    );
  }

  if (entry.status === "claimed") {
    return NextResponse.json(
      { error: "This spot has already been claimed" },
      { status: 400 }
    );
  }

  if (entry.status !== "offered") {
    return NextResponse.json(
      { error: "This waitlist offer is no longer valid" },
      { status: 400 }
    );
  }

  if (!entry.expires_at || new Date(entry.expires_at) <= new Date()) {
    await supabase
      .from("waitlist")
      .update({ status: "expired" })
      .eq("id", entry.id);

    return NextResponse.json(
      { error: "This offer has expired" },
      { status: 400 }
    );
  }

  // Check for duplicate booking
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("schedule_id", entry.schedule_id)
    .eq("profile_id", entry.profile_id)
    .eq("date", entry.date)
    .eq("status", "confirmed")
    .single();

  if (existingBooking) {
    await supabase
      .from("waitlist")
      .update({ status: "claimed" })
      .eq("id", entry.id);

    return NextResponse.json(
      { error: "You already have a booking for this class" },
      { status: 400 }
    );
  }

  // Validate payment method
  if (payment_method === "membership") {
    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("profile_id", entry.profile_id)
      .eq("studio_id", studioId)
      .eq("status", "active")
      .gt("current_period_end", new Date().toISOString())
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "No active membership found" },
        { status: 400 }
      );
    }
  }

  let packResult: { packId: string; previousCredits: number } | null = null;
  if (payment_method === "pack_credit") {
    packResult = await decrementPackCredit(supabase, entry.profile_id, studioId);
    if (!packResult) {
      return NextResponse.json(
        { error: "No pack credits available" },
        { status: 400 }
      );
    }
  }

  // Create booking — bypass capacity check since the spot was held for them
  const { error: bookingError } = await supabase.from("bookings").insert({
    studio_id: studioId,
    schedule_id: entry.schedule_id,
    profile_id: entry.profile_id,
    date: entry.date,
    status: "confirmed",
    payment_method,
  });

  if (bookingError) {
    // Roll back pack credit if we decremented one
    if (packResult) {
      await supabase
        .from("class_packs")
        .update({ credits_remaining: packResult.previousCredits })
        .eq("id", packResult.packId);
    }

    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }

  // Mark waitlist entry as claimed
  await supabase
    .from("waitlist")
    .update({ status: "claimed" })
    .eq("id", entry.id);

  // Send confirmation email (fire-and-forget)
  sendBookingConfirmation({
    profileId: entry.profile_id,
    studioId,
    scheduleId: entry.schedule_id,
    date: entry.date,
    paymentMethod: payment_method,
  });

  return NextResponse.json({ success: true });
}
