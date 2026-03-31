"use client";

import { useState, useEffect, useCallback } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripeClient } from "@/lib/stripe-client";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import type { CheckoutType } from "@/lib/types";

interface CheckoutModalProps {
  type: CheckoutType;
  onClose: () => void;
  onSuccess: () => void;
  /** For dropin / waitlist_claim */
  scheduleId?: string;
  date?: string;
  /** For pack */
  tierId?: string;
  /** For waitlist_claim */
  waitlistToken?: string;
  /** User profile id for polling */
  profileId: string;
}

export default function CheckoutModal(props: CheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [displayData, setDisplayData] = useState<{
    name: string;
    pricePounds: string;
    description: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError("");

      try {
        const isMembership = props.type === "membership";
        const endpoint = isMembership
          ? "/api/checkout/create-subscription"
          : "/api/checkout/create-payment-intent";

        let body: Record<string, string>;
        if (props.type === "dropin") {
          body = { type: "dropin", schedule_id: props.scheduleId!, date: props.date! };
        } else if (props.type === "pack") {
          body = { type: "pack", tier_id: props.tierId! };
        } else if (props.type === "waitlist_claim") {
          body = {
            type: "waitlist_claim",
            schedule_id: props.scheduleId!,
            date: props.date!,
            waitlist_token: props.waitlistToken!,
          };
        } else if (props.type === "membership") {
          body = { tier_id: props.tierId! };
        } else {
          throw new Error("Invalid checkout type");
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Error ${res.status}`);
        }

        const data = await res.json();
        setClientSecret(data.clientSecret);
        setStripeAccountId(data.stripeAccountId ?? null);
        setDisplayData(data.displayData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialise payment");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [props.type, props.scheduleId, props.date, props.tierId, props.waitlistToken]);

  return (
    <div
      className="fixed inset-0 bg-charcoal/55 backdrop-blur-sm z-[1100] flex items-center justify-center p-4"
      onClick={props.onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[440px] overflow-hidden animate-fade-up"
        style={{ animationDuration: "0.3s" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-cocoa px-6 py-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-wheat">
            Checkout
          </h3>
          <button
            onClick={props.onClose}
            className="text-wheat/50 hover:text-wheat transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[calc(100dvh-200px)] overflow-y-auto">
          {loading && (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-full border-2 border-sand border-t-gold animate-spin mx-auto mb-3" />
              <p className="text-[0.82rem] text-warm-grey">Preparing checkout...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-6">
              <p className="text-[0.85rem] text-ember mb-4">{error}</p>
              <button
                onClick={props.onClose}
                className="px-6 py-2 rounded-full border border-sand text-[0.75rem] font-semibold tracking-[0.05em] uppercase text-warm-grey hover:bg-cream transition-colors"
              >
                Go back
              </button>
            </div>
          )}

          {!loading && !error && clientSecret && displayData && (
            <Elements
              stripe={getStripeClient(stripeAccountId)}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#C4A95A",
                    colorBackground: "#F5F0E8",
                    colorText: "#4A4A4A",
                    fontFamily: "DM Sans, system-ui, sans-serif",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              <CheckoutModalForm
                type={props.type}
                displayData={displayData}
                profileId={props.profileId}
                scheduleId={props.scheduleId}
                date={props.date}
                tierId={props.tierId}
                onClose={props.onClose}
                onSuccess={props.onSuccess}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}

/** Inner form — must be inside <Elements> */
function CheckoutModalForm({
  type,
  displayData,
  profileId,
  scheduleId,
  date,
  tierId,
  onClose,
  onSuccess,
}: {
  type: CheckoutType;
  displayData: { name: string; pricePounds: string; description: string };
  profileId: string;
  scheduleId?: string;
  date?: string;
  tierId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const { toast } = useToast();

  const supabase = createClient();

  // Polling logic
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

    const timeout = setTimeout(() => {
      setPolling(false);
      setTimedOut(true);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [polling, type, scheduleId, date, tierId, profileId, supabase]);

  // Trigger onSuccess after confirmation
  useEffect(() => {
    if (confirmed) {
      const label =
        type === "dropin" || type === "waitlist_claim"
          ? "Booking confirmed"
          : type === "pack"
            ? "Class pack purchased"
            : "Membership activated";
      toast(label);
      const timer = setTimeout(() => onSuccess(), 1200);
      return () => clearTimeout(timer);
    }
  }, [confirmed]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/account/checkout/success?type=${type}${scheduleId ? `&schedule_id=${scheduleId}` : ""}${date ? `&date=${date}` : ""}${tierId ? `&tier_id=${tierId}` : ""}`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Payment failed. Please try again.");
      setLoading(false);
    } else {
      setPolling(true);
    }
  }

  // Confirmed state
  if (confirmed) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-semibold text-cocoa mb-1">
          Payment confirmed
        </h3>
        <p className="text-[0.82rem] text-warm-grey">
          {type === "dropin" || type === "waitlist_claim"
            ? "Your class is booked."
            : type === "pack"
              ? "Your class pack is ready to use."
              : "Your membership is now active."}
        </p>
      </div>
    );
  }

  // Timed out state
  if (timedOut) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h3 className="font-display text-lg font-semibold text-cocoa mb-1">
          Payment received
        </h3>
        <p className="text-[0.82rem] text-warm-grey mb-4">
          Confirmation is taking longer than expected. It will appear in your account shortly.
        </p>
        <button
          onClick={() => {
            toast("Payment received — check your account");
            onSuccess();
          }}
          className="px-6 py-2 rounded-full bg-gold text-cocoa text-[0.75rem] font-semibold tracking-[0.05em] uppercase hover:bg-wheat transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  // Polling state
  if (polling) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-3 animate-pulse">
          <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h3 className="font-display text-lg font-semibold text-cocoa mb-1">
          Processing payment...
        </h3>
        <p className="text-[0.82rem] text-warm-grey">
          Your payment was received. Confirming now...
        </p>
      </div>
    );
  }

  // Payment form
  return (
    <form onSubmit={handleSubmit}>
      {/* Order summary */}
      <div className="bg-cream rounded-xl p-4 mb-4">
        <div className="flex justify-between items-baseline">
          <div>
            <h4 className="text-[0.88rem] font-semibold text-cocoa">
              {displayData.name}
            </h4>
            <p className="text-[0.72rem] text-warm-grey mt-0.5">
              {displayData.description}
            </p>
          </div>
          <span className="font-display text-xl font-semibold text-cocoa">
            &pound;{displayData.pricePounds}
          </span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="mb-4">
        <PaymentElement />
      </div>

      {error && (
        <p className="text-[0.8rem] text-ember mb-3">{error}</p>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-full border border-sand text-[0.75rem] font-semibold tracking-[0.05em] uppercase text-warm-grey hover:bg-cream active:scale-95 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-[2] py-2.5 rounded-full bg-cocoa text-wheat text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-gold hover:text-cocoa transition-colors disabled:opacity-60"
        >
          {loading ? "Processing..." : `Pay \u00a3${displayData.pricePounds}`}
        </button>
      </div>
    </form>
  );
}
