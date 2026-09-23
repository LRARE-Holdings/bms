import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBooking } from "@/lib/email/notify-booking";
import { getStudioId } from "@/lib/studio-context";
import {
  isBookingClosed,
  isClassSkipped,
  getBookingCount,
  getClassCapacity,
  findEligiblePack,
  spendPackCredit,
  slotIsBookableOn,
  BOOKABLE_SLOT_COLUMNS,
  isBeyondBookingHorizon,
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
      .select(BOOKABLE_SLOT_COLUMNS)
      .eq("id", schedule_id)
      .eq("studio_id", studioId)
      .single();

    if (!scheduleSlot) {
      return NextResponse.json({ error: "Schedule slot not found" }, { status: 404 });
    }

    if (!slotIsBookableOn(scheduleSlot, date)) {
      return NextResponse.json(
        { error: "Booking date does not match the scheduled day for this class" },
        { status: 400 }
      );
    }

    if (isBeyondBookingHorizon(date)) {
      return NextResponse.json(
        { error: "The timetable for this period hasn't been released yet" },
        { status: 400 }
      );
    }

    if (isBookingClosed(scheduleSlot.start_time, date)) {
      return NextResponse.json(
        { error: "Bookings close 30 minutes before class starts" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    if (
      await isClassSkipped(
        admin,
        studioId,
        schedule_id,
        date,
        scheduleSlot.start_time
      )
    ) {
      return NextResponse.json(
        { error: "This class has been cancelled" },
        { status: 400 }
      );
    }

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

    // Work out which pack pays, but don't charge it yet.
    const packResult = await findEligiblePack(
      admin,
      user.id,
      studioId,
      scheduleSlot.class_id,
    );
    if (!packResult.ok) {
      const error =
        packResult.reason === "class_excluded"
          ? "Your pack credits can't be used for this class."
          : "No credits available";
      return NextResponse.json({ error }, { status: 400 });
    }

    // Create booking. class_pack_id is what lets a later cancellation return the
    // credit to the pack that actually paid, rather than guessing at the
    // member's packs and often picking an expired one.
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .insert({
        studio_id: studioId,
        schedule_id,
        profile_id: user.id,
        date,
        status: "confirmed",
        payment_method: "pack_credit",
        class_pack_id: packResult.packId,
      })
      .select("id")
      .single();

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      // 23514 = a pack's weekly limit, e.g. the Beginner's Course allows two
      // classes a week. The database writes that message for the member.
      const status = bookingError.code === "23514" ? 400 : 500;
      return NextResponse.json(
        { error: bookingError.message || "Failed to create booking" },
        { status }
      );
    }

    // Booking is in — now charge the credit. Nothing was spent if we never got
    // here, so there is no rollback to do.
    const charged = await spendPackCredit(admin, packResult.packId, booking.id);
    if (!charged) {
      await admin.from("bookings").delete().eq("id", booking.id);
      return NextResponse.json(
        { error: "Could not use your credit for this booking. Please try again." },
        { status: 500 }
      );
    }

    await notifyBooking({
      studioId,
      profileId: user.id,
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
