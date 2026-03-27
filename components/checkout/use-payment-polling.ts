"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CheckoutType } from "@/lib/types";

export function usePaymentPolling({
  type,
  scheduleId,
  date,
  tierId,
  profileId,
}: {
  type: CheckoutType;
  scheduleId?: string;
  date?: string;
  tierId?: string;
  profileId: string;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [polling, setPolling] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const supabase = createClient();

  const startPolling = useCallback(() => {
    setPolling(true);
  }, []);

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      let found = false;

      if ((type === "dropin" || type === "waitlist_claim") && scheduleId && date) {
        const { data } = await supabase
          .from("bookings")
          .select("id")
          .eq("schedule_id", scheduleId)
          .eq("profile_id", profileId)
          .eq("date", date)
          .eq("status", "confirmed")
          .single();
        found = !!data;
      } else if (type === "pack" && tierId) {
        const { data } = await supabase
          .from("class_packs")
          .select("id")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        found = !!data;
      } else if (type === "membership" && tierId) {
        const { data } = await supabase
          .from("memberships")
          .select("id")
          .eq("profile_id", profileId)
          .eq("membership_tier_id", tierId)
          .eq("status", "active")
          .single();
        found = !!data;
      }

      if (found) {
        setConfirmed(true);
        setPolling(false);
      }
    }, 2000);

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      setPolling(false);
      setTimedOut(true);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [polling, type, scheduleId, date, tierId, profileId, supabase]);

  return { confirmed, polling, timedOut, startPolling };
}
