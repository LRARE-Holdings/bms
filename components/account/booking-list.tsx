"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface BookingRow {
  id: string;
  date: string;
  status: string;
  payment_method: string;
  schedule: {
    start_time: string;
    classes: { name: string; slug: string; duration_mins: number };
    instructors: { name: string };
  };
}

export default function BookingList({
  bookings,
  emptyMessage,
  showCancel,
}: {
  bookings: BookingRow[];
  emptyMessage: string;
  showCancel?: boolean;
}) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleCancel(bookingId: string) {
    if (!confirm("Cancel this booking?")) return;
    setCancellingId(bookingId);

    const res = await fetch("/api/bookings/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to cancel booking. Please try again.");
    }
    setCancellingId(null);
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-sand rounded-2xl p-8 text-center">
        <p className="text-[0.88rem] text-warm-grey">{emptyMessage}</p>
        <a
          href="/account"
          className="inline-block mt-3 text-[0.78rem] font-semibold text-gold hover:underline"
        >
          Browse the timetable &rarr;
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white border border-sand rounded-2xl overflow-hidden divide-y divide-sand">
      {bookings.map((booking) => {
        const dateObj = new Date(booking.date + "T00:00:00");
        const dateStr = dateObj.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        const time = booking.schedule.start_time.slice(0, 5);

        return (
          <div
            key={booking.id}
            className="flex items-center gap-4 px-5 py-3.5"
          >
            {/* Date */}
            <div className="min-w-[70px]">
              <div className="text-[0.88rem] font-semibold text-cocoa">
                {dateStr}
              </div>
              <div className="text-[0.72rem] text-warm-grey">{time}</div>
            </div>

            {/* Class info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[0.88rem] text-cocoa truncate">
                {booking.schedule.classes.name}
              </div>
              <div className="text-[0.72rem] text-warm-grey">
                {booking.schedule.instructors.name} &middot;{" "}
                {booking.schedule.classes.duration_mins} min
              </div>
            </div>

            {/* Payment badge */}
            <span className="text-[0.62rem] font-semibold tracking-[0.05em] uppercase px-2.5 py-0.5 rounded-full bg-cream text-warm-grey hidden sm:inline">
              {booking.payment_method === "pack_credit" ? "Pack" : "Drop-in"}
            </span>

            {/* Status */}
            {booking.status === "cancelled" && (
              <span className="text-[0.62rem] font-semibold tracking-[0.05em] uppercase px-2.5 py-0.5 rounded-full bg-ember/10 text-ember">
                Cancelled
              </span>
            )}

            {/* Cancel button */}
            {showCancel && booking.status === "confirmed" && (
              <button
                onClick={() => handleCancel(booking.id)}
                disabled={cancellingId === booking.id}
                className="text-[0.7rem] font-semibold text-warm-grey hover:text-ember transition-colors disabled:opacity-50"
              >
                {cancellingId === booking.id ? "..." : "Cancel"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
