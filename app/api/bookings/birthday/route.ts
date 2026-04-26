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
  validateBookingDay,
  isBeyondBookingHorizon,
} from "@/lib/booking-helpers";

const schema = z.object({
  schedule_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  token: z.string().uuid(),
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

    const { schedule_id, date, token } = parsed.data;
    const admin = createAdminClient();

    // Validate birthday token
    const { data: birthdayToken } = await admin
      .from("birthday_tokens")
      .select("id, status, expires_at, profile_id")
      .eq("token", token)
      .eq("studio_id", studioId)
      .eq("profile_id", user.id)
      .single();

    if (!birthdayToken) {
      return NextResponse.json(
        { error: "Invalid birthday token" },
        { status: 400 }
      );
    }

    if (birthdayToken.status === "used") {
      return NextResponse.json(
        { error: "This birthday treat has already been used" },
        { status: 400 }
      );
    }

    if (
      birthdayToken.status === "expired" ||
      new Date(birthdayToken.expires_at) <= new Date()
    ) {
      return NextResponse.json(
        { error: "This birthday treat has expired" },
        { status: 400 }
      );
    }

    // Fetch schedule slot with class info
    const { data: scheduleSlot } = await supabase
      .from("schedule")
      .select("start_time, class_id, day_of_week")
      .eq("id", schedule_id)
      .eq("studio_id", studioId)
      .single();

    if (!scheduleSlot) {
      return NextResponse.json(
        { error: "Schedule slot not found" },
        { status: 404 }
      );
    }

    if (!validateBookingDay(scheduleSlot.day_of_week, date)) {
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

    if (await isClassSkipped(admin, studioId, schedule_id, date)) {
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

    // Check no duplicate booking
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

    // Atomically mark token as used (optimistic lock prevents race conditions)
    const { data: updated, error: updateError } = await admin
      .from("birthday_tokens")
      .update({ status: "used" })
      .eq("id", birthdayToken.id)
      .eq("status", "active")
      .select("id");

    if (updateError || !updated || updated.length === 0) {
      return NextResponse.json(
        { error: "This birthday treat has already been used" },
        { status: 400 }
      );
    }

    // Create booking
    const { error: bookingError } = await admin.from("bookings").insert({
      studio_id: studioId,
      schedule_id,
      profile_id: user.id,
      date,
      status: "confirmed",
      payment_method: "birthday",
    });

    if (bookingError) {
      console.error("Birthday booking insert error:", bookingError);

      // Roll back the token status for genuine server errors.
      // Unique constraint violations (23505) mean the user tried to double-book.
      if (bookingError.code !== "23505") {
        await admin
          .from("birthday_tokens")
          .update({ status: "active" })
          .eq("id", birthdayToken.id);
      }

      return NextResponse.json(
        { error: bookingError.message || "Failed to create booking" },
        { status: 500 }
      );
    }

    await notifyBooking({
      studioId,
      profileId: user.id,
      scheduleId: schedule_id,
      date,
      paymentMethod: "birthday",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Birthday booking error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
