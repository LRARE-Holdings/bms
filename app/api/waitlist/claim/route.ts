import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBooking } from "@/lib/email/notify-booking";
import { getStudioId } from "@/lib/studio-context";
import { findEligiblePack, spendPackCredit } from "@/lib/booking-helpers";

const schema = z.object({
  token: z.string().uuid(),
  payment_method: z.enum(["membership", "pack_credit"]),
});

export async function POST(request: NextRequest) {
  try {
  const userClient = await createClient();
  const studioId = await getStudioId();

  // Authenticate the caller
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createAdminClient();

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

  // Verify the authenticated user owns this waitlist entry
  if (entry.profile_id !== user.id) {
    return NextResponse.json(
      { error: "This waitlist offer belongs to a different account" },
      { status: 403 }
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
    .maybeSingle();

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
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "No active membership found" },
        { status: 400 }
      );
    }
  }

  // Work out which pack pays, but don't charge it until the booking exists.
  let packId: string | null = null;
  if (payment_method === "pack_credit") {
    // Look up the class so we can honour any pack tier exclusions.
    const { data: scheduleSlot } = await supabase
      .from("schedule")
      .select("class_id")
      .eq("id", entry.schedule_id)
      .eq("studio_id", studioId)
      .single();

    const classId = (scheduleSlot?.class_id as string | undefined) ?? null;

    const result = await findEligiblePack(
      supabase,
      entry.profile_id,
      studioId,
      classId,
    );
    if (!result.ok) {
      const error =
        result.reason === "class_excluded"
          ? "Your pack credits can't be used for this class."
          : "No pack credits available";
      return NextResponse.json({ error }, { status: 400 });
    }
    packId = result.packId;
  }

  // Create booking — bypass capacity check since the spot was held for them
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      studio_id: studioId,
      schedule_id: entry.schedule_id,
      profile_id: entry.profile_id,
      date: entry.date,
      status: "confirmed",
      payment_method,
      class_pack_id: packId,
    })
    .select("id")
    .single();

  if (bookingError) {
    // Nothing was charged, so there is no credit to put back.
    const status = bookingError.code === "23514" ? 400 : 500;
    return NextResponse.json(
      { error: bookingError.message || "Failed to create booking" },
      { status }
    );
  }

  if (packId) {
    const charged = await spendPackCredit(supabase, packId, booking.id);
    if (!charged) {
      await supabase.from("bookings").delete().eq("id", booking.id);
      return NextResponse.json(
        { error: "Could not use your credit for this booking. Please try again." },
        { status: 500 }
      );
    }
  }

  // Mark waitlist entry as claimed
  await supabase
    .from("waitlist")
    .update({ status: "claimed" })
    .eq("id", entry.id);

  await notifyBooking({
    studioId,
    profileId: entry.profile_id,
    scheduleId: entry.schedule_id,
    date: entry.date,
    paymentMethod: payment_method,
  });

  return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist claim error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
