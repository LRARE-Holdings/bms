"use client";

import type { TimetableSlot } from "@/lib/types";

const BOOKING_CUTOFF_MINS = 30;

const colorMap: Record<string, string> = {
  "hot-pilates": "bg-ember",
  "hot-yoga": "bg-ember",
  "pilates-sculpt": "bg-gold",
  "cardio-pilates": "bg-blush",
  "beginners-pilates": "bg-sand",
  "baby-me-yoga": "bg-cocoa",
};

function isBookingClosed(slot: TimetableSlot): boolean {
  const [h, m] = slot.start_time.split(":").map(Number);
  const classStart = new Date(slot.date + "T00:00:00");
  classStart.setHours(h, m, 0, 0);
  const cutoff = new Date(classStart.getTime() - BOOKING_CUTOFF_MINS * 60_000);
  return new Date() >= cutoff;
}

export default function SlotCard({
  slot,
  onBook,
}: {
  slot: TimetableSlot;
  onBook: () => void;
}) {
  const barColor = colorMap[slot.class_slug] ?? "bg-gold";
  const isFull = slot.spots_remaining <= 0;
  const isClosed = !isFull && isBookingClosed(slot);
  const isLow = slot.spots_remaining > 0 && slot.spots_remaining <= 3;
  const priceDisplay =
    slot.price_pence % 100 === 0
      ? `£${slot.price_pence / 100}`
      : `£${(slot.price_pence / 100).toFixed(2)}`;

  // Format time from "HH:MM:SS" to "HH:MM"
  const time = slot.start_time.slice(0, 5);
  const isBookable = !isFull && !isClosed;

  return (
    <div
      className={`flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 rounded-xl transition-colors mb-0.5 ${
        isBookable ? "hover:bg-cream cursor-pointer" : "cursor-default"
      }`}
      onClick={isBookable ? onBook : undefined}
    >
      {/* Time */}
      <div className="min-w-[55px] text-right">
        <div className="text-[0.88rem] font-semibold text-cocoa">{time}</div>
        <div className="text-[0.65rem] text-warm-grey">{slot.duration_mins} min</div>
      </div>

      {/* Color bar */}
      <div className={`w-[3px] h-8 rounded-sm flex-shrink-0 ${barColor}`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[0.88rem] text-cocoa truncate">
          {slot.class_name}
        </div>
        <div className="text-[0.7rem] text-warm-grey">
          {slot.instructor_name} &middot; 10 spots
        </div>
      </div>

      {/* Spots remaining */}
      <span
        className={`text-[0.65rem] font-semibold tracking-[0.05em] uppercase px-2.5 py-0.5 rounded-full whitespace-nowrap hidden sm:inline ${
          isFull || isClosed
            ? "bg-warm-grey/10 text-warm-grey"
            : isLow
              ? "bg-ember/[0.12] text-ember"
              : "bg-gold/[0.12] text-gold"
        }`}
        title={isClosed ? "Bookings close 30 minutes before class starts" : undefined}
      >
        {isFull ? "Full" : isClosed ? "Closed" : `${slot.spots_remaining} left`}
      </span>

      {/* Price */}
      <span className="text-[0.75rem] font-semibold text-cocoa min-w-[42px] text-right hidden md:block">
        {priceDisplay}
      </span>

      {/* Book button */}
      {isFull ? (
        <button
          disabled
          className="px-4 py-1.5 bg-sand text-warm-grey rounded-full text-[0.7rem] font-semibold tracking-[0.05em] uppercase cursor-not-allowed"
        >
          Full
        </button>
      ) : isClosed ? (
        <div className="flex flex-col items-center gap-0.5">
          <button
            disabled
            title="Bookings close 30 minutes before class starts"
            className="px-4 py-1.5 bg-sand text-warm-grey rounded-full text-[0.7rem] font-semibold tracking-[0.05em] uppercase cursor-not-allowed"
          >
            Closed
          </button>
          <span className="text-[0.55rem] text-warm-grey text-center leading-tight max-w-[80px]">
            Closes 30 min before
          </span>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
          className="px-4 py-1.5 bg-cocoa text-wheat rounded-full text-[0.7rem] font-semibold tracking-[0.05em] uppercase cursor-pointer hover:bg-gold hover:text-cocoa transition-colors"
        >
          Book
        </button>
      )}
    </div>
  );
}
