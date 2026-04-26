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

    // Check user has an active membership that covers the booking date
    const bookingDateEnd = `${date}T23:59:59.999Z`;
    const { data: membership } = await supabase
      .from("memberships")
      .select("id, status, current_period_end")
      .eq("profile_id", user.id)
      .eq("studio_id", studioId)
      .eq("status", "active")
      .gt("current_period_end", bookingDateEnd)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "No active membership covering this date" },
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

    const admin = createAdminClient();

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

    // Create booking via admin client (RLS-safe)
    const { error: bookingError } = await admin.from("bookings").insert({
      studio_id: studioId,
      schedule_id,
      profile_id: user.id,
      date,
      status: "confirmed",
      payment_method: "membership",
    });

    if (bookingError) {
      console.error("Membership booking insert error:", bookingError);
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
      paymentMethod: "membership",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Membership booking error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
