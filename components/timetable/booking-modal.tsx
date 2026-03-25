"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import ClassIcon from "@/components/classes/class-icons";
import type { TimetableSlot } from "@/lib/types";

export default function BookingModal({
  slot,
  onClose,
  onBooked,
  studioId,
  mode = "book",
}: {
  slot: TimetableSlot;
  onClose: () => void;
  onBooked: () => void;
  studioId: string;
  mode?: "book" | "waitlist";
}) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [packCredits, setPackCredits] = useState<number | null>(null);
  const [hasMembership, setHasMembership] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [waitlistSuccess, setWaitlistSuccess] = useState<number | null>(null);
  const [alreadyOnWaitlist, setAlreadyOnWaitlist] = useState(false);

  const supabase = createClient();
  const { toast } = useToast();

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

        // Check existing waitlist entry if in waitlist mode
        if (mode === "waitlist") {
          const { data: existingWaitlist } = await supabase
            .from("waitlist")
            .select("id")
            .eq("profile_id", user.id)
            .eq("studio_id", studioId)
            .eq("schedule_id", slot.schedule_id)
            .eq("date", slot.date)
            .in("status", ["waiting", "offered"])
            .limit(1);

          setAlreadyOnWaitlist(
            !!existingWaitlist && existingWaitlist.length > 0
          );
        }
      }
    }
    loadUser();
  }, [supabase, studioId]);

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
        toast("Booking confirmed — see you on the mat");
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
      if (res.ok) {
        toast("Booking confirmed — 1 credit used");
        onBooked();
      } else {
        const text = await res.text().catch(() => "");
        let errorMsg = `Error ${res.status}`;
        try {
          const data = JSON.parse(text);
          errorMsg = data.error || errorMsg;
        } catch {
          errorMsg = text.slice(0, 200) || errorMsg;
        }
        setError(errorMsg);
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

  async function handleJoinWaitlist() {
    setLoading(true);
    setError("");
    try {
      // Get current max position
      const { data: maxPos } = await supabase
        .from("waitlist")
        .select("position")
        .eq("studio_id", studioId)
        .eq("schedule_id", slot.schedule_id)
        .eq("date", slot.date)
        .order("position", { ascending: false })
        .limit(1)
        .single();

      const position = (maxPos?.position ?? 0) + 1;

      const { error: insertError } = await supabase.from("waitlist").insert({
        studio_id: studioId,
        schedule_id: slot.schedule_id,
        date: slot.date,
        profile_id: user!.id,
        position,
        status: "waiting",
      });

      if (insertError) {
        if (insertError.code === "23505") {
          setError("You're already on the waitlist for this class.");
        } else {
          setError("Failed to join waitlist. Please try again.");
        }
        setLoading(false);
        return;
      }

      setWaitlistSuccess(position);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
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
        <div className="bg-cocoa px-6 py-5 flex items-start gap-4">
          <div className="text-wheat/40 shrink-0 mt-0.5 scale-[1.1]">
            <ClassIcon slug={slot.class_slug} />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-wheat mb-0.5">
              {slot.class_name}
            </h3>
            <p className="text-[0.75rem] text-warm-grey">
              {dateDisplay} &middot; {time} &middot; {slot.duration_mins} min
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {!user ? (
            <div className="text-center py-4">
              <p className="text-[0.88rem] text-slate mb-4">
                {mode === "waitlist"
                  ? "Log in or sign up to join the waitlist."
                  : "Log in or sign up to book this class."}
              </p>
              <a
                href="/login"
                className="inline-block px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat active:scale-95 transition-all"
              >
                Log in
              </a>
            </div>
          ) : mode === "waitlist" ? (
            <>
              {/* Waitlist mode */}
              <div className="flex justify-between items-center py-2 border-b border-sand">
                <span className="text-[0.8rem] text-warm-grey">Instructor</span>
                <span className="text-[0.8rem] font-semibold text-cocoa">
                  {slot.instructor_name}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[0.8rem] text-warm-grey">Status</span>
                <span className="text-[0.8rem] font-semibold text-ember">
                  Class full
                </span>
              </div>

              {waitlistSuccess !== null ? (
                <div className="text-center py-4">
                  <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-[0.88rem] font-semibold text-cocoa mb-1">
                    You&apos;re #{waitlistSuccess} on the waitlist
                  </p>
                  <p className="text-[0.75rem] text-warm-grey">
                    We&apos;ll email you if a spot opens up.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-8 py-2.5 rounded-full bg-gold text-cocoa text-[0.75rem] font-semibold tracking-[0.05em] uppercase hover:bg-wheat transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : alreadyOnWaitlist ? (
                <div className="text-center py-4">
                  <p className="text-[0.88rem] text-cocoa mb-1">
                    You&apos;re already on the waitlist for this class.
                  </p>
                  <p className="text-[0.75rem] text-warm-grey">
                    We&apos;ll email you if a spot opens up.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-8 py-2.5 rounded-full border border-sand text-[0.75rem] font-semibold tracking-[0.05em] uppercase text-warm-grey hover:bg-cream active:scale-95 transition-all"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-ember/[0.08] px-4 py-3 rounded-xl my-3">
                    <p className="text-[0.8rem] text-cocoa">
                      Join the waitlist and we&apos;ll email you if a spot opens up. You&apos;ll have 30 minutes to claim it.
                    </p>
                  </div>

                  {error && (
                    <p className="text-[0.8rem] text-ember mb-3">{error}</p>
                  )}

                  <div className="flex gap-2.5 mt-2">
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-full border border-sand text-[0.75rem] font-semibold tracking-[0.05em] uppercase text-warm-grey hover:bg-cream active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoinWaitlist}
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-full bg-ember text-white text-[0.75rem] font-semibold tracking-[0.05em] uppercase hover:bg-ember/90 active:scale-95 transition-all disabled:opacity-60"
                    >
                      {loading ? "Joining..." : "Join waitlist"}
                    </button>
                  </div>
                </>
              )}
            </>
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
                  {slot.spots_remaining} of {slot.max_capacity}
                </span>
              </div>

              {error && (
                <p className="text-[0.8rem] text-ember mt-3">{error}</p>
              )}

              {/* Membership — single action */}
              {hasMembership && (
                <div className="mt-3 space-y-2.5">
                  <div className="flex justify-between items-center bg-gold/[0.08] px-4 py-3 rounded-xl">
                    <span className="text-[0.8rem] text-cocoa">Membership</span>
                    <strong className="text-[0.8rem] text-gold">Included</strong>
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-full border border-sand text-[0.75rem] font-semibold tracking-[0.05em] uppercase text-warm-grey hover:bg-cream active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMembershipBooking}
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-full bg-gold text-cocoa text-[0.75rem] font-semibold tracking-[0.05em] uppercase hover:bg-wheat active:scale-95 transition-all disabled:opacity-60"
                    >
                      {loading ? "Booking..." : "Book with membership"}
                    </button>
                  </div>
                </div>
              )}

              {/* Non-membership — show both credit and drop-in options */}
              {!hasMembership && (
                <div className="mt-3 space-y-2.5">
                  {/* Pack credit option */}
                  {packCredits !== null && packCredits > 0 && (
                    <button
                      onClick={handlePackBooking}
                      disabled={loading}
                      className="w-full flex justify-between items-center bg-gold/[0.08] px-4 py-3 rounded-xl hover:bg-gold/[0.15] active:scale-[0.98] transition-all disabled:opacity-60 group"
                    >
                      <div className="text-left">
                        <span className="block text-[0.82rem] font-semibold text-cocoa">
                          Use a class credit
                        </span>
                        <span className="block text-[0.68rem] text-warm-grey">
                          {packCredits} credit{packCredits === 1 ? "" : "s"} remaining
                        </span>
                      </div>
                      <span className="text-[0.72rem] font-semibold tracking-[0.06em] uppercase text-gold group-hover:text-cocoa transition-colors">
                        {loading ? "Booking..." : "Use credit"}
                      </span>
                    </button>
                  )}

                  {/* Divider when both options shown */}
                  {packCredits !== null && packCredits > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-sand" />
                      <span className="text-[0.65rem] text-warm-grey/60 uppercase tracking-wider">or</span>
                      <div className="flex-1 h-px bg-sand" />
                    </div>
                  )}

                  {/* Drop-in pay option */}
                  <button
                    onClick={handlePayCheckout}
                    disabled={loading}
                    className="w-full flex justify-between items-center bg-cream px-4 py-3 rounded-xl hover:bg-sand/40 active:scale-[0.98] transition-all disabled:opacity-60 group"
                  >
                    <div className="text-left">
                      <span className="block text-[0.82rem] font-semibold text-cocoa">
                        Pay drop-in
                      </span>
                      <span className="block text-[0.68rem] text-warm-grey">
                        One-time card payment
                      </span>
                    </div>
                    <span className="font-display text-lg font-semibold text-cocoa">
                      {priceDisplay}
                    </span>
                  </button>

                  {/* Cancel */}
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-full border border-sand text-[0.75rem] font-semibold tracking-[0.05em] uppercase text-warm-grey hover:bg-cream active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
