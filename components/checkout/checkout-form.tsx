"use client";

import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { usePaymentPolling } from "./use-payment-polling";
import type { CheckoutType } from "@/lib/types";
import Link from "next/link";

export default function CheckoutForm({
  type,
  displayData,
  profileId,
  scheduleId,
  date,
  tierId,
}: {
  type: CheckoutType;
  displayData: { name: string; pricePounds: string; description: string };
  profileId: string;
  scheduleId?: string;
  date?: string;
  tierId?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { confirmed, polling, startPolling } = usePaymentPolling({
    type,
    scheduleId,
    date,
    tierId,
    profileId,
  });

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
      // Payment succeeded without redirect — start polling
      startPolling();
    }
  }

  // Payment confirmed by polling
  if (confirmed) {
    const returnHref =
      type === "dropin"
        ? "/account/bookings"
        : type === "pack"
          ? "/account/packs"
          : "/account/membership";

    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gold/10 rounded-full mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C4A95A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-semibold text-cocoa mb-2">
          Payment confirmed
        </h2>
        <p className="text-[0.88rem] text-warm-grey mb-6">
          {type === "dropin"
            ? "Your class is booked."
            : type === "pack"
              ? "Your class pack is ready to use."
              : "Your membership is now active."}
        </p>
        <Link
          href={returnHref}
          className="inline-block px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
        >
          {type === "dropin"
            ? "View bookings"
            : type === "pack"
              ? "View packs"
              : "View membership"}
        </Link>
      </div>
    );
  }

  // Polling in progress (payment succeeded, waiting for record)
  if (polling) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gold/10 rounded-full mb-4 animate-pulse">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C4A95A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-semibold text-cocoa mb-2">
          Processing payment...
        </h2>
        <p className="text-[0.84rem] text-warm-grey">
          Your payment was received. Confirming your{" "}
          {type === "dropin"
            ? "booking"
            : type === "pack"
              ? "class pack"
              : "membership"}
          ...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Order summary */}
      <div className="bg-white border border-sand rounded-2xl p-5 mb-6">
        <h3 className="font-display text-lg font-semibold text-cocoa mb-1">
          {displayData.name}
        </h3>
        <p className="text-[0.78rem] text-warm-grey mb-3">
          {displayData.description}
        </p>
        <div className="flex justify-between items-baseline border-t border-sand pt-3">
          <span className="text-[0.82rem] font-semibold text-cocoa">Total</span>
          <span className="font-display text-2xl font-semibold text-cocoa">
            &pound;{displayData.pricePounds}
          </span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="mb-6">
        <PaymentElement />
      </div>

      {error && (
        <p className="text-[0.8rem] text-ember mb-4">{error}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 rounded-full bg-cocoa text-wheat text-[0.82rem] font-semibold tracking-[0.06em] uppercase hover:bg-gold hover:text-cocoa transition-colors disabled:opacity-60"
      >
        {loading
          ? "Processing..."
          : `Pay \u00a3${displayData.pricePounds}`}
      </button>
    </form>
  );
}
