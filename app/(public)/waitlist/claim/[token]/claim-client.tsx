"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import CheckoutModal from "@/components/checkout/checkout-modal";

export default function WaitlistClaimClient({
  token,
  className,
  dateDisplay,
  startTime,
  durationMins,
  instructorName,
  expiresAt,
  scheduleId,
  date,
  pricePence,
  studioId,
}: {
  token: string;
  className: string;
  dateDisplay: string;
  startTime: string;
  durationMins: number;
  instructorName: string;
  expiresAt: number;
  scheduleId: string;
  date: string;
  pricePence: number;
  studioId: string;
}) {
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  );
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState("");

  // Payment method state
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [hasMembership, setHasMembership] = useState(false);
  const [packCredits, setPackCredits] = useState<number | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);

  const supabase = createClient();

  const priceDisplay =
    pricePence % 100 === 0
      ? `\u00a3${pricePence / 100}`
      : `\u00a3${(pricePence / 100).toFixed(2)}`;

  // Check auth and payment methods on mount
  useEffect(() => {
    async function checkPayment() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
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

      setCheckingPayment(false);
    }
    checkPayment();
  }, [supabase, studioId]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((expiresAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, timeLeft]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isExpired = timeLeft <= 0;

  async function handleClaimWithMethod(
    paymentMethod: "membership" | "pack_credit"
  ) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, payment_method: paymentMethod }),
      });
      const data = await res.json();

      if (res.ok) {
        setClaimed(true);
      } else {
        setError(data.error || "Failed to claim spot. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  function handlePayWithStripe() {
    setShowCheckout(true);
  }

  if (showCheckout && user) {
    return (
      <CheckoutModal
        type="waitlist_claim"
        scheduleId={scheduleId}
        date={date}
        waitlistToken={token}
        profileId={user.id}
        onClose={() => setShowCheckout(false)}
        onSuccess={() => setClaimed(true)}
      />
    );
  }

  if (claimed) {
    return (
      <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto text-center">
        <div className="bg-white border border-sand rounded-2xl overflow-hidden">
          <div className="bg-cocoa px-6 py-5">
            <h1 className="font-display text-xl font-semibold text-wheat">
              Spot claimed!
            </h1>
          </div>
          <div className="px-6 py-8">
            <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-[0.92rem] font-semibold text-cocoa mb-1">
              You&apos;re booked into {className}
            </p>
            <p className="text-[0.8rem] text-warm-grey mb-1">
              {dateDisplay} at {startTime}
            </p>
            <p className="text-[0.75rem] text-warm-grey">
              {instructorName} &middot; {durationMins} min
            </p>
            <a
              href="/account/bookings"
              className="inline-block mt-6 px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
            >
              View my bookings
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (isExpired) {
    return (
      <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto text-center">
        <div className="bg-white border border-sand rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-cocoa mb-3">
            Offer expired
          </h1>
          <p className="text-[0.88rem] text-warm-grey">
            This offer has expired. The spot has been offered to the next person
            on the waitlist.
          </p>
          <a
            href="/account"
            className="inline-block mt-5 px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
          >
            Browse timetable
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto">
      <div className="bg-white border border-sand rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-cocoa px-6 py-5">
          <h1 className="font-display text-xl font-semibold text-wheat mb-0.5">
            A spot opened up!
          </h1>
          <p className="text-[0.75rem] text-warm-grey">
            Claim your place before the offer expires
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Class details */}
          <div className="flex justify-between items-center py-2 border-b border-sand">
            <span className="text-[0.8rem] text-warm-grey">Class</span>
            <span className="text-[0.8rem] font-semibold text-cocoa">
              {className}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-sand">
            <span className="text-[0.8rem] text-warm-grey">Date</span>
            <span className="text-[0.8rem] font-semibold text-cocoa">
              {dateDisplay}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-sand">
            <span className="text-[0.8rem] text-warm-grey">Time</span>
            <span className="text-[0.8rem] font-semibold text-cocoa">
              {startTime} &middot; {durationMins} min
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-[0.8rem] text-warm-grey">Instructor</span>
            <span className="text-[0.8rem] font-semibold text-cocoa">
              {instructorName}
            </span>
          </div>

          {/* Countdown */}
          <div className="bg-ember/[0.08] px-4 py-3 rounded-xl my-4 text-center">
            <p className="text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-ember mb-1">
              Time remaining
            </p>
            <p className="font-display text-2xl font-semibold text-cocoa tabular-nums">
              {mins}:{secs.toString().padStart(2, "0")}
            </p>
          </div>

          {error && (
            <p className="text-[0.8rem] text-ember mb-3">{error}</p>
          )}

          {/* Payment options */}
          {!user ? (
            <div className="text-center py-2">
              <p className="text-[0.88rem] text-slate mb-4">
                Log in to claim your spot.
              </p>
              <a
                href={`/login?redirect=/waitlist/claim/${token}`}
                className="inline-block px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
              >
                Log in
              </a>
            </div>
          ) : checkingPayment ? (
            <div className="py-4 text-center text-[0.82rem] text-warm-grey">
              Checking payment options...
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Membership option */}
              {hasMembership && (
                <button
                  onClick={() => handleClaimWithMethod("membership")}
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-gold text-cocoa text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors disabled:opacity-60"
                >
                  {loading ? "Claiming..." : "Claim with membership"}
                </button>
              )}

              {/* Pack credit option */}
              {!hasMembership && packCredits !== null && packCredits > 0 && (
                <>
                  <div className="flex justify-between items-center bg-gold/[0.08] px-4 py-3 rounded-xl">
                    <span className="text-[0.8rem] text-cocoa">
                      Pack credits
                    </span>
                    <strong className="text-[0.8rem] text-cocoa">
                      {packCredits} remaining
                    </strong>
                  </div>
                  <button
                    onClick={() => handleClaimWithMethod("pack_credit")}
                    disabled={loading}
                    className="w-full py-3 rounded-full bg-gold text-cocoa text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors disabled:opacity-60"
                  >
                    {loading ? "Claiming..." : "Claim with pack credit"}
                  </button>
                </>
              )}

              {/* Stripe drop-in option */}
              {!hasMembership &&
                (packCredits === null || packCredits <= 0) && (
                  <>
                    <div className="flex justify-between items-center bg-cream px-4 py-3 rounded-xl">
                      <span className="text-[0.82rem] font-semibold text-cocoa">
                        Drop-in price
                      </span>
                      <span className="font-display text-xl font-semibold text-cocoa">
                        {priceDisplay}
                      </span>
                    </div>
                    <button
                      onClick={handlePayWithStripe}
                      disabled={loading}
                      className="w-full py-3 rounded-full bg-cocoa text-wheat text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-gold hover:text-cocoa transition-colors disabled:opacity-60"
                    >
                      {loading ? "Loading..." : `Pay ${priceDisplay}`}
                    </button>
                  </>
                )}

              {/* Secondary option: pay with Stripe even when pack/membership exists */}
              {(hasMembership ||
                (packCredits !== null && packCredits > 0)) && (
                <button
                  onClick={handlePayWithStripe}
                  className="w-full py-2 text-[0.72rem] font-semibold text-warm-grey hover:text-cocoa transition-colors"
                >
                  or pay drop-in ({priceDisplay})
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
