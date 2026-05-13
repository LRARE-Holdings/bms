"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMemberProfile } from "@/components/member-profile/member-profile-context";

interface Attendee {
  profile_id: string;
  full_name: string | null;
  email: string | null;
}

export default function AttendeeList({
  scheduleId,
  date,
  studioId,
}: {
  scheduleId: string;
  date: string;
  studioId: string;
}) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const { open } = useMemberProfile();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("bookings")
        .select("profile_id, profiles:profile_id(full_name, email)")
        .eq("schedule_id", scheduleId)
        .eq("date", date)
        .eq("studio_id", studioId)
        .eq("status", "confirmed");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = (data || []).map((b: any) => {
        const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
        return {
          profile_id: b.profile_id as string,
          full_name: (p?.full_name as string | null) ?? null,
          email: (p?.email as string | null) ?? null,
        } as Attendee;
      });
      setAttendees(list);
      setLoading(false);
    }
    load();
  }, [scheduleId, date, studioId]);

  if (loading) {
    return (
      <p className="text-[0.78rem] text-warm-grey py-2">
        Loading attendees...
      </p>
    );
  }

  if (attendees.length === 0) {
    return (
      <p className="text-[0.78rem] text-warm-grey py-2">No bookings yet.</p>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-gold mb-1">
        {attendees.length} booked
      </p>
      {attendees.map((a) => (
        <button
          key={a.profile_id}
          type="button"
          onClick={() => open(a.profile_id)}
          className="w-full text-left flex items-center justify-between bg-cream rounded-lg px-3 py-2 hover:bg-gold/10 transition-colors"
        >
          <span className="text-[0.82rem] text-cocoa font-medium">
            {a.full_name || "Unknown"}
          </span>
          <span className="text-[0.72rem] text-warm-grey">{a.email}</span>
        </button>
      ))}
    </div>
  );
}
