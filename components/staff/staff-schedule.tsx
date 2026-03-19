"use client";

import { useState } from "react";
import AttendeeList from "./attendee-list";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface ScheduleSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classes: { name: string; duration_mins: number };
  instructors: { name: string };
}

export default function StaffSchedule({
  slots,
  studioId,
}: {
  slots: ScheduleSlot[];
  studioId: string;
}) {
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);

  // Get next 7 days
  const dates: { date: Date; dayOfWeek: number; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1; // Convert to 0=Mon
    dates.push({
      date: d,
      dayOfWeek: dow,
      label: d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    });
  }

  return (
    <div className="space-y-4">
      {dates.map(({ date, dayOfWeek, label }) => {
        const daySlots = slots.filter((s) => s.day_of_week === dayOfWeek);
        if (daySlots.length === 0) return null;

        const dateStr = date.toISOString().split("T")[0];

        return (
          <div key={dateStr}>
            <h3 className="text-[0.66rem] font-semibold tracking-[0.15em] uppercase text-warm-grey mb-2">
              {label}
            </h3>
            <div className="bg-white border border-sand rounded-2xl overflow-hidden divide-y divide-sand">
              {daySlots.map((slot) => {
                const slotKey = `${slot.id}_${dateStr}`;
                const isExpanded = expandedSlot === slotKey;
                const time = slot.start_time.slice(0, 5);

                return (
                  <div key={slot.id}>
                    <button
                      onClick={() =>
                        setExpandedSlot(isExpanded ? null : slotKey)
                      }
                      className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-cream transition-colors"
                    >
                      <div className="min-w-[50px]">
                        <div className="text-[0.88rem] font-semibold text-cocoa">
                          {time}
                        </div>
                        <div className="text-[0.65rem] text-warm-grey">
                          {slot.classes.duration_mins} min
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-[0.88rem] text-cocoa">
                          {slot.classes.name}
                        </div>
                        <div className="text-[0.72rem] text-warm-grey">
                          {slot.instructors.name}
                        </div>
                      </div>
                      <span className="text-warm-grey text-sm">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-4">
                        <AttendeeList
                          scheduleId={slot.id}
                          date={dateStr}
                          studioId={studioId}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
