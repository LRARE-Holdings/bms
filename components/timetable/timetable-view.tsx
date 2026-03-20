"use client";

import { useEffect, useState, useCallback } from "react";
import SlotCard from "./slot-card";
import BookingModal from "./booking-modal";
import type { TimetableSlot } from "@/lib/types";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateRange(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  const startStr = start.toLocaleDateString("en-GB", opts);
  const endStr = end.toLocaleDateString("en-GB", {
    ...opts,
    year: "numeric",
  });
  return `${startStr} – ${endStr}`;
}

function formatDate(d: Date, dayOffset: number): string {
  const date = new Date(d);
  date.setDate(date.getDate() + dayOffset);
  return date.getDate().toString();
}

function isDayPast(weekStart: Date, dayOffset: number): boolean {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayOffset);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export default function TimetableView({ studioId }: { studioId: string }) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1; // Convert to 0=Mon
  });
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalSlot, setModalSlot] = useState<TimetableSlot | null>(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    const dateStr = weekStart.toISOString().split("T")[0];
    const res = await fetch(`/api/timetable?week_start=${dateStr}`);
    const data = await res.json();
    setSlots(data.slots || []);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const changeWeek = (delta: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7 * delta);
    setWeekStart(next);
  };

  const daySlots = slots
    .filter((s) => s.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <>
      <div className="bg-white border border-sand rounded-2xl overflow-hidden">
        {/* Week header */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-sand">
          <h3 className="font-display text-lg font-semibold text-cocoa">
            {formatDateRange(weekStart)}
          </h3>
          <div className="flex gap-1.5">
            <button
              onClick={() => changeWeek(-1)}
              className="w-8 h-8 rounded-full border border-sand bg-transparent flex items-center justify-center text-cocoa hover:bg-cream hover:border-gold transition-colors text-sm"
            >
              &larr;
            </button>
            <button
              onClick={() => changeWeek(1)}
              className="w-8 h-8 rounded-full border border-sand bg-transparent flex items-center justify-center text-cocoa hover:bg-cream hover:border-gold transition-colors text-sm"
            >
              &rarr;
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex border-b border-sand overflow-x-auto">
          {DAY_NAMES.map((name, i) => {
            const past = isDayPast(weekStart, i);
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`flex-1 min-w-[65px] py-2.5 px-1 text-center relative transition-colors ${
                  past
                    ? "opacity-40"
                    : selectedDay === i
                      ? "bg-cream"
                      : "hover:bg-cream"
                }`}
              >
                <span
                  className={`block text-[0.58rem] font-semibold tracking-[0.1em] uppercase ${
                    past
                      ? "text-warm-grey"
                      : selectedDay === i
                        ? "text-gold"
                        : "text-warm-grey"
                  }`}
                >
                  {name}
                </span>
                <span
                  className={`block text-base font-semibold mt-0.5 ${
                    past ? "text-warm-grey" : "text-cocoa"
                  }`}
                >
                  {formatDate(weekStart, i)}
                </span>
                {selectedDay === i && (
                  <span className="absolute bottom-0 left-[20%] right-[20%] h-0.5 bg-gold rounded-sm" />
                )}
              </button>
            );
          })}
        </div>

        {/* Slots */}
        <div className="p-2">
          {loading ? (
            <div className="py-12 text-center text-warm-grey text-sm">
              Loading schedule...
            </div>
          ) : daySlots.length === 0 ? (
            <div className="py-12 text-center text-warm-grey text-sm">
              No classes scheduled for this day.
            </div>
          ) : (
            daySlots.map((slot) => (
              <SlotCard
                key={slot.schedule_id}
                slot={slot}
                onBook={() => setModalSlot(slot)}
              />
            ))
          )}
        </div>
      </div>

      {/* Booking modal */}
      {modalSlot && (
        <BookingModal
          slot={modalSlot}
          studioId={studioId}
          onClose={() => setModalSlot(null)}
          onBooked={() => {
            setModalSlot(null);
            fetchSlots();
          }}
        />
      )}
    </>
  );
}
