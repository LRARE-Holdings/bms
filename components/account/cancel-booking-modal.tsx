"use client";

import { useState } from "react";

interface CancelBookingModalProps {
  bookingId: string;
  className: string;
  dateDisplay: string;
  time: string;
  paymentMethod: string;
  onClose: () => void;
  onCancelled: () => void;
}

function getRefundInfo(paymentMethod: string): {
  willRefund: boolean;
  message: string;
} {
  switch (paymentMethod) {
    case "pack_credit":
      return {
        willRefund: true,
        message: "Your class credit will be restored to your pack.",
      };
    case "membership":
      return {
        willRefund: false,
        message: "No refund needed — this class is included in your membership.",
      };
    case "complimentary":
      return {
        willRefund: false,
        message: "This was a complimentary class. Your free class offer will not be restored.",
      };
    case "birthday":
      return {
        willRefund: false,
        message: "This was a birthday treat. Your birthday offer will not be restored.",
      };
    case "stripe":
    default:
      return {
        willRefund: false,
        message: "Drop-in payments are not automatically refunded. Contact the studio if you need a refund.",
      };
  }
}

export default function CancelBookingModal({
  bookingId,
  className,
  dateDisplay,
  time,
  paymentMethod,
  onClose,
  onCancelled,
}: CancelBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refundInfo = getRefundInfo(paymentMethod);

  async function handleConfirm() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      if (res.ok) {
        onCancelled();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to cancel booking. Please try again.");
        setLoading(false);
      }
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
        className="bg-white rounded-2xl w-full max-w-[400px] overflow-hidden animate-fade-up"
        style={{ animationDuration: "0.3s" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <h3 className="font-display text-lg font-semibold text-cocoa">
            Cancel booking?
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <div className="bg-cream rounded-xl px-4 py-3 mb-4">
            <p className="text-[0.85rem] font-semibold text-cocoa">
              {className}
            </p>
            <p className="text-[0.75rem] text-warm-grey mt-0.5">
              {dateDisplay} at {time}
            </p>
          </div>

          {/* Refund info */}
          <div
            className={`px-4 py-3 rounded-xl mb-4 ${
              refundInfo.willRefund
                ? "bg-gold/[0.08] border border-gold/20"
                : "bg-ember/[0.06] border border-ember/15"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {refundInfo.willRefund ? (
                <svg className="w-4 h-4 text-gold shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-ember shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              <p className="text-[0.8rem] text-cocoa leading-relaxed">
                {refundInfo.message}
              </p>
            </div>
          </div>

          {error && (
            <p className="text-[0.8rem] text-ember mb-3">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-full border border-sand text-[0.75rem] font-semibold tracking-[0.05em] uppercase text-warm-grey hover:bg-cream active:scale-95 transition-all disabled:opacity-60"
            >
              Keep booking
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-full bg-ember text-white text-[0.75rem] font-semibold tracking-[0.05em] uppercase hover:bg-ember/90 active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? "Cancelling..." : "Cancel booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
