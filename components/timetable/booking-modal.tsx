"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TimetableSlot } from "@/lib/types";

export default function BookingModal({
  slot,
  onClose,
  onBooked,
  studioId,
}: {
  slot: TimetableSlot;
  onClose: () => void;
  onBooked: () => void;
  studioId: string;
}) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [packCredits, setPackCredits] = useState<number | null>(null);
  const [hasMembership, setHasMembership] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Check for active membership and pack credits in parallel
        const [membershipResult, packsResult] = await Promise.all([
          supabase
            .from("memberships")
            .select("id")
            .eq("profile_id", user.id)
            .eq("studio_id", studioId)
            .eq("status", "active")
            .gt("current_period_end", new Date().toISOString())
            .limit(1),
          supabase
            .from("class_packs")
            .select("credits_remaining")
            .eq("profile_id", user.id)
            .eq("studio_id", studioId)
            .gt("credits_remaining", 0)
            .gt("expires_at", new Date().toISOString()),
        ]);

        setHasMembership(
          !!membershipResult.data && membershipResult.data.length > 0
        );

        const total =
          packsResult.data?.reduce(
            (sum, p) => sum + p.credits_remaining,
            0
          ) ?? 0;
        setPackCredits(total);
      }
    }
    loadUser();
  }, [supabase]);

  const priceDisplay =
    slot.price_pence % 100 === 0
      ? `\u00a3${slot.price_pence / 100}`
      : `\u00a3${(slot.price_pence / 100).toFixed(2)}`;

  const time = slot.start_time.slice(0, 5);
  const dateObj = new Date(slot.date + "T00:00:00");
  const dateDisplay = dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  async function handleMembershipBooking() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: slot.schedule_id,
          date: slot.date,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onBooked();
      } else {
        setError(data.error || "Failed to book class");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handlePackBooking() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: slot.schedule_id,
          date: slot.date,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onBooked();
      } else {
        setError(data.error || "Failed to book class");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function handlePayCheckout() {
    window.location.href = `/account/checkout?type=dropin&schedule_id=${slot.schedule_id}&date=${slot.date}`;
  }

  return (
    <div
      className="fixed inset-0 bg-charcoal/55 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[420px] overflow-hidden animate-fade-up"
        style={{ animationDuration: "0.3s" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-cocoa px-6 py-5">
          <h3 className="font-display text-xl font-semibold text-wheat mb-0.5">
            {slot.class_name}
          </h3>
          <p className="text-[0.75rem] text-warm-grey">
            {dateDisplay} &middot; {time} &middot; {slot.duration_mins} min
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {!user ? (
            <div className="text-center py-4">
              <p className="text-[0.88rem] text-slate mb-4">
                Log in or sign up to book this class.
              </p>
              <a
                href="/login"
                className="inline-block px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
              >
                Log in
              </a>
            </div>
          ) : (
            <>
              {/* Details */}
              <div className="flex justify-between items-center py-2 border-b border-sand">
                <span className="text-[0.8rem] text-warm-grey">Instructor</span>
                <span className="text-[0.8rem] font-semibold text-cocoa">
                  {slot.instructor_name}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[0.8rem] text-warm-grey">Spots remaining</span>
                <span className="text-[0.8rem] font-semibold text-cocoa">
                  {slot.spots_remaining} of 10
                </span>
              </div>

              {/* Membership option */}
              {hasMembership && (
                <div className="flex justify-between items-center bg-gold/[0.08] px-4 py-3 rounded-xl my-3">
                  <span className="text-[0.8rem] text-cocoa">Membership</span>
                  <strong className="text-[0.8rem] text-gold">Included</strong>
                </div>
              )}

              {/* Drop-in price (show when no membership) */}
              {!hasMembership && (
                <div className="flex justify-between items-center bg-cream px-4 py-3 rounded-xl my-3">
                  <span className="text-[0.82rem] font-semibold text-cocoa">
                    Drop-in price
                  </span>
                  <span className="font-display text-xl font-semibold text-cocoa">
                    {priceDisplay}
                  </span>
                </div>
              )}

              {/* Pack option (show when no membership but has credits) */}
              {!hasMembership && packCredits !== null && packCredits > 0 && (
                <>
                  <div className="text-center text-[0.75rem] text-warm-grey my-2">
                    or use a class pack credit
                  </div>
                  <div className="flex justify-between items-center bg-gold/[0.08] px-4 py-3 rounded-xl mb-3">
                    <span className="text-[0.8rem] text-cocoa">Pack credits</span>
                    <strong className="text-[0.8rem] text-cocoa">
                      {packCredits} remaining
                    </strong>
                  </div>
                </>
              )}

              {error && (
                <p className="text-[0.8rem] text-ember mb-3">{error}</p>
              )}

              {/* Actions — priority: membership > pack credit > pay */}
              <div className="flex gap-2.5 mt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-full border border-sand text-[0.75rem] font-semibold tracking-[0.05em] uppercase text-warm-grey hover:bg-cream transition-colors"
                >
                  Cancel
                </button>
                {hasMembership ? (
                  <button
                    onClick={handleMembershipBooking}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-full bg-gold text-cocoa text-[0.75rem] font-semibold tracking-[0.05em] uppercase hover:bg-wheat transition-colors disabled:opacity-60"
                  >
                    {loading ? "Booking..." : "Book with membership"}
                  </button>
                ) : packCredits !== null && packCredits > 0 ? (
                  <button
                    onClick={handlePackBooking}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-full bg-gold text-cocoa text-[0.75rem] font-semibold tracking-[0.05em] uppercase hover:bg-wheat transition-colors disabled:opacity-60"
                  >
                    {loading ? "Booking..." : "Use credit"}
                  </button>
                ) : (
                  <button
                    onClick={handlePayCheckout}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-full bg-cocoa text-wheat text-[0.75rem] font-semibold tracking-[0.05em] uppercase hover:bg-gold hover:text-cocoa transition-colors disabled:opacity-60"
                  >
                    {loading ? "Loading..." : `Pay ${priceDisplay}`}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
