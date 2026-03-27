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
    const admin = createAdminClient();

    // Check studio has the free class offer enabled
    const { data: studio } = await admin
      .from("studios")
      .select("first_class_free_enabled")
      .eq("id", studioId)
      .single();

    if (!studio?.first_class_free_enabled) {
      return NextResponse.json(
        { error: "Free class offer is not currently available" },
        { status: 400 }
      );
    }

    // Check user hasn't already used their free class at this studio
    const { data: membership } = await admin
      .from("studio_memberships")
      .select("id, free_class_used")
      .eq("profile_id", user.id)
      .eq("studio_id", studioId)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "No membership found" },
        { status: 400 }
      );
    }

    if (membership.free_class_used) {
      return NextResponse.json(
        { error: "You have already used your free class" },
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

    // Atomically mark free class as used (optimistic lock prevents race conditions)
    const { data: updated, error: updateError } = await admin
      .from("studio_memberships")
      .update({ free_class_used: true })
      .eq("id", membership.id)
      .eq("free_class_used", false)
      .select("id");

    if (updateError || !updated || updated.length === 0) {
      return NextResponse.json(
        { error: "You have already used your free class" },
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
      payment_method: "complimentary",
    });

    if (bookingError) {
      console.error("Complimentary booking insert error:", bookingError);

      // Only roll back the free_class_used flag for genuine server errors.
      // Unique constraint violations (23505) mean the user tried to double-book,
      // so the free credit is forfeited (one-shot policy).
      if (bookingError.code !== "23505") {
        await admin
          .from("studio_memberships")
          .update({ free_class_used: false })
          .eq("id", membership.id);
      }

      return NextResponse.json(
        { error: bookingError.message || "Failed to create booking" },
        { status: 500 }
      );
    }

    sendBookingConfirmation({
      profileId: user.id,
      studioId,
      scheduleId: schedule_id,
      date,
      paymentMethod: "complimentary",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Complimentary booking error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
