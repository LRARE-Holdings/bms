"use client";

import { useEffect, useState } from "react";
import CheckoutModal from "@/components/checkout/checkout-modal";

function formatRemaining(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}:${String(s).padStart(2, "0")}`;
}

export default function EventClaimClient(props: {
  token: string;
  eventId: string;
  eventTitle: string;
  dateDisplay: string;
  timeDisplay: string | null;
  location: string | null;
  quantity: number;
  totalDisplay: string;
  expiresAt: number;
  profileId: string;
}) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, Math.floor((props.expiresAt - Date.now()) / 1000)));
  const [showCheckout, setShowCheckout] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((props.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [props.expiresAt]);

  if (claimed) {
    return (
      <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto text-center">
        <div className="bg-white border border-sand rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-cocoa mb-3">You&apos;re in!</h1>
          <p className="text-[0.88rem] text-warm-grey">
            Your tickets for {props.eventTitle} are confirmed. We&apos;ve emailed you the details.
          </p>
          <a
            href="/account/events"
            className="inline-block mt-5 px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
          >
            My tickets
          </a>
        </div>
      </section>
    );
  }

  const expired = timeLeft <= 0;
  const rows: [string, string][] = [
    ["Event", props.eventTitle],
    ["Date", props.dateDisplay],
    ...(props.timeDisplay ? ([["Time", props.timeDisplay]] as [string, string][]) : []),
    ...(props.location ? ([["Where", props.location]] as [string, string][]) : []),
    ["Tickets", String(props.quantity)],
    ["Total", props.totalDisplay],
  ];

  return (
    <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto">
      <div className="bg-white border border-sand rounded-2xl overflow-hidden">
        <div className="bg-cocoa px-6 py-5">
          <h1 className="font-display text-xl font-semibold text-wheat mb-0.5">
            {props.quantity === 1 ? "A place opened up!" : "Places opened up!"}
          </h1>
          <p className="text-[0.75rem] text-warm-grey">They&apos;re held for you until the offer runs out</p>
        </div>
        <div className="px-6 py-5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 items-center py-2 border-b border-sand">
              <span className="text-[0.8rem] text-warm-grey">{label}</span>
              <span className="text-[0.8rem] font-semibold text-cocoa text-right">{value}</span>
            </div>
          ))}
          <p className={`mt-4 text-center text-[0.82rem] font-semibold ${expired ? "text-ember" : "text-cocoa"}`}>
            {expired ? "This offer has expired." : `Time left: ${formatRemaining(timeLeft)}`}
          </p>
          <button
            disabled={expired}
            onClick={() => setShowCheckout(true)}
            className="mt-4 w-full py-3 rounded-full bg-gold text-cocoa text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors disabled:opacity-50"
          >
            Pay {props.totalDisplay}
          </button>
        </div>
      </div>
      {showCheckout && (
        <CheckoutModal
          type="event_ticket"
          eventId={props.eventId}
          quantity={props.quantity}
          eventClaimToken={props.token}
          profileId={props.profileId}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            setClaimed(true);
          }}
        />
      )}
    </section>
  );
}
