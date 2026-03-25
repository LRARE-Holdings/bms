"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

function isDayToday(weekStart: Date, dayOffset: number): boolean {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayOffset);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

async function fetchTimetable(weekStart: Date): Promise<TimetableSlot[]> {
  const dateStr = weekStart.toISOString().split("T")[0];
  const res = await fetch(`/api/timetable?week_start=${dateStr}`);
  const data = await res.json();
  return data.slots || [];
}

export default function TimetableView({ studioId }: { studioId: string }) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalSlot, setModalSlot] = useState<TimetableSlot | null>(null);
  const [modalMode, setModalMode] = useState<"book" | "waitlist">("book");
  const [refreshKey, setRefreshKey] = useState(0);
  // Set of "scheduleId_date" keys the current user has already booked
  const [userBookedKeys, setUserBookedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Data fetch pattern: loading → fetch → resolve
    setLoading(true);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    // Fetch timetable and user's bookings in parallel
    const supabase = createClient();
    Promise.all([
      fetchTimetable(weekStart),
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return [];
        return supabase
          .from("bookings")
          .select("schedule_id, date")
          .eq("profile_id", user.id)
          .eq("studio_id", studioId)
          .eq("status", "confirmed")
          .gte("date", weekStartStr)
          .lte("date", weekEndStr)
          .then(({ data }) => data || []);
      }),
    ]).then(([timetableSlots, bookings]) => {
      if (!cancelled) {
        setSlots(timetableSlots);
        const keys = new Set<string>();
        for (const b of bookings) {
          keys.add(`${b.schedule_id}_${b.date}`);
        }
        setUserBookedKeys(keys);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [weekStart, refreshKey, studioId]);

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
            const isToday = isDayToday(weekStart, i);
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
                  {isToday ? "Today" : name}
                </span>
                <span
                  className={`block text-base font-semibold mt-0.5 ${
                    past ? "text-warm-grey" : isToday && selectedDay !== i ? "text-gold" : "text-cocoa"
                  }`}
                >
                  {formatDate(weekStart, i)}
                </span>
                {selectedDay === i && (
                  <span className="absolute bottom-0 left-[20%] right-[20%] h-0.5 bg-gold rounded-sm" />
                )}
                {isToday && selectedDay !== i && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
                )}
              </button>
            );
          })}
        </div>

        {/* Slots */}
        <div className="p-2">
          {loading ? (
            <div className="space-y-1 py-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 rounded-xl"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="min-w-[55px] space-y-1.5">
                    <div className="h-3.5 w-10 rounded bg-sand/60 animate-shimmer" style={{ backgroundImage: "linear-gradient(90deg, transparent, rgba(223,208,165,0.3), transparent)", backgroundSize: "200% 100%" }} />
                    <div className="h-2.5 w-7 rounded bg-sand/40 animate-shimmer" style={{ backgroundImage: "linear-gradient(90deg, transparent, rgba(223,208,165,0.3), transparent)", backgroundSize: "200% 100%", animationDelay: "0.15s" }} />
                  </div>
                  <div className="w-[3px] h-8 rounded-sm bg-sand/50" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-28 rounded bg-sand/60 animate-shimmer" style={{ backgroundImage: "linear-gradient(90deg, transparent, rgba(223,208,165,0.3), transparent)", backgroundSize: "200% 100%", animationDelay: "0.1s" }} />
                    <div className="h-2.5 w-20 rounded bg-sand/40 animate-shimmer" style={{ backgroundImage: "linear-gradient(90deg, transparent, rgba(223,208,165,0.3), transparent)", backgroundSize: "200% 100%", animationDelay: "0.2s" }} />
                  </div>
                  <div className="h-7 w-16 rounded-full bg-sand/50 animate-shimmer" style={{ backgroundImage: "linear-gradient(90deg, transparent, rgba(223,208,165,0.3), transparent)", backgroundSize: "200% 100%", animationDelay: "0.25s" }} />
                </div>
              ))}
            </div>
          ) : daySlots.length === 0 ? (
            <div className="py-12 text-center text-warm-grey text-sm">
              No classes scheduled for this day.
            </div>
          ) : (
            daySlots.map((slot, i) => (
              <div
                key={slot.schedule_id}
                className="opacity-0 animate-fade-up"
                style={{ animationDelay: `${i * 0.06}s`, animationDuration: "0.4s" }}
              >
                <SlotCard
                  slot={slot}
                  isBooked={userBookedKeys.has(`${slot.schedule_id}_${slot.date}`)}
                  onBook={() => {
                    setModalMode("book");
                    setModalSlot(slot);
                  }}
                  onWaitlist={() => {
                    setModalMode("waitlist");
                    setModalSlot(slot);
                  }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Booking / waitlist modal */}
      {modalSlot && (
        <BookingModal
          slot={modalSlot}
          studioId={studioId}
          mode={modalMode}
          onClose={() => setModalSlot(null)}
          onBooked={() => {
            setModalSlot(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}
