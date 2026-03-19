"use client";

import type { TimetableSlot } from "@/lib/types";

const colorMap: Record<string, string> = {
  "hot-pilates": "bg-ember",
  "hot-yoga": "bg-ember",
  "pilates-sculpt": "bg-gold",
  "cardio-pilates": "bg-blush",
  "beginners-pilates": "bg-sand",
  "baby-me-yoga": "bg-cocoa",
};

export default function SlotCard({
  slot,
  onBook,
}: {
  slot: TimetableSlot;
  onBook: () => void;
}) {
  const barColor = colorMap[slot.class_slug] ?? "bg-gold";
  const isFull = slot.spots_remaining <= 0;
  const isLow = slot.spots_remaining > 0 && slot.spots_remaining <= 3;
  const priceDisplay =
    slot.price_pence % 100 === 0
      ? `£${slot.price_pence / 100}`
      : `£${(slot.price_pence / 100).toFixed(2)}`;

  // Format time from "HH:MM:SS" to "HH:MM"
  const time = slot.start_time.slice(0, 5);

  return (
    <div
      className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 rounded-xl transition-colors hover:bg-cream mb-0.5 cursor-pointer"
      onClick={isFull ? undefined : onBook}
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
          isFull
            ? "bg-warm-grey/10 text-warm-grey"
            : isLow
              ? "bg-ember/[0.12] text-ember"
              : "bg-gold/[0.12] text-gold"
        }`}
      >
        {isFull ? "Full" : `${slot.spots_remaining} left`}
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
