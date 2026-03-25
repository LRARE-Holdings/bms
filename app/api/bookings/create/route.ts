import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmation } from "@/lib/email/send";
import { getStudioId } from "@/lib/studio-context";
import {
  isBookingClosed,
  getBookingCount,
  getClassCapacity,
  decrementPackCredit,
} from "@/lib/booking-helpers";

const schema = z.object({
  schedule_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: NextRequest) {
  try {
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

    const { schedule_id, date } = parsed.data;

    // Fetch schedule slot with class info
    const { data: scheduleSlot } = await supabase
      .from("schedule")
      .select("start_time, class_id")
      .eq("id", schedule_id)
      .eq("studio_id", studioId)
      .single();

    if (!scheduleSlot) {
      return NextResponse.json({ error: "Schedule slot not found" }, { status: 404 });
    }

    if (isBookingClosed(scheduleSlot.start_time, date)) {
      return NextResponse.json(
        { error: "Bookings close 30 minutes before class starts" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const [bookingCount, maxCapacity] = await Promise.all([
      getBookingCount(admin, schedule_id, date, studioId),
      getClassCapacity(studioId, scheduleSlot.class_id),
    ]);

    if (bookingCount >= maxCapacity) {
      return NextResponse.json({ error: "Class is full" }, { status: 400 });
    }

    // Check no duplicate booking (maybeSingle returns null when no rows, not an error)
    const { data: existingBooking } = await admin
      .from("bookings")
      .select("id")
      .eq("schedule_id", schedule_id)
      .eq("profile_id", user.id)
      .eq("date", date)
      .eq("status", "confirmed")
      .maybeSingle();

    if (existingBooking) {
      return NextResponse.json(
        { error: "You already have a booking for this class" },
        { status: 400 }
      );
    }

    // Atomically decrement pack credits (optimistic lock prevents race conditions)
    const packResult = await decrementPackCredit(admin, user.id, studioId);
    if (!packResult) {
      return NextResponse.json({ error: "No credits available" }, { status: 400 });
    }

    // Create booking
    const { error: bookingError } = await admin.from("bookings").insert({
      studio_id: studioId,
      schedule_id,
      profile_id: user.id,
      date,
      status: "confirmed",
      payment_method: "pack_credit",
    });

    if (bookingError) {
      // Roll back credit
      await admin
        .from("class_packs")
        .update({ credits_remaining: packResult.previousCredits })
        .eq("id", packResult.packId);

      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    sendBookingConfirmation({
      profileId: user.id,
      studioId,
      scheduleId: schedule_id,
      date,
      paymentMethod: "pack_credit",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Pack credit booking error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
