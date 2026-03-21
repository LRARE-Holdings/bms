"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface WaitlistRow {
  id: string;
  date: string;
  position: number;
  status: "waiting" | "offered";
  expires_at: string | null;
  schedule: {
    start_time: string;
    classes: { name: string; slug: string; duration_mins: number };
    instructors: { name: string };
  };
}

export default function WaitlistList({
  entries,
}: {
  entries: WaitlistRow[];
}) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleCancel(entryId: string) {
    if (!confirm("Remove yourself from this waitlist?")) return;
    setCancellingId(entryId);

    const { error } = await supabase
      .from("waitlist")
      .update({ status: "cancelled" })
      .eq("id", entryId);

    if (!error) {
      router.refresh();
    } else {
      alert("Failed to cancel waitlist entry. Please try again.");
    }
    setCancellingId(null);
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-sand rounded-2xl overflow-hidden divide-y divide-sand">
      {entries.map((entry) => {
        const dateObj = new Date(entry.date + "T00:00:00");
        const dateStr = dateObj.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        const time = entry.schedule.start_time.slice(0, 5);

        return (
          <div
            key={entry.id}
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
                {entry.schedule.classes.name}
              </div>
              <div className="text-[0.72rem] text-warm-grey">
                {entry.schedule.instructors.name} &middot;{" "}
                {entry.schedule.classes.duration_mins} min
              </div>
            </div>

            {/* Position / status badge */}
            {entry.status === "offered" ? (
              <span className="text-[0.62rem] font-semibold tracking-[0.05em] uppercase px-2.5 py-0.5 rounded-full bg-ember/12 text-ember whitespace-nowrap">
                Spot available
              </span>
            ) : (
              <span className="text-[0.62rem] font-semibold tracking-[0.05em] uppercase px-2.5 py-0.5 rounded-full bg-gold/12 text-gold whitespace-nowrap hidden sm:inline">
                #{entry.position} in queue
              </span>
            )}

            {/* Cancel button */}
            <button
              onClick={() => handleCancel(entry.id)}
              disabled={cancellingId === entry.id}
              className="text-[0.7rem] font-semibold text-warm-grey hover:text-ember transition-colors disabled:opacity-50"
            >
              {cancellingId === entry.id ? "..." : "Leave"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
