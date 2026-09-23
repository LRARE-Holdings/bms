"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CheckoutModal from "@/components/checkout/checkout-modal";
import { useToast } from "@/components/ui/toast";
import type { EventAvailability, EventMemberState } from "@/lib/types";

interface Props {
  eventId: string;
  pricePence: number;
  maxPerMember: number;
  /** ISO instant, or null when on sale now */
  salesOpenAt: string | null;
  availability: EventAvailability;
  /** Null when signed out */
  profileId: string | null;
  member: EventMemberState | null;
}

const primary =
  "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase bg-cocoa text-wheat hover:bg-gold hover:text-cocoa transition-colors disabled:opacity-60";
const secondary =
  "inline-flex items-center justify-center px-5 py-2 rounded-full text-[0.7rem] font-semibold tracking-[0.06em] uppercase border-[1.5px] border-cocoa text-cocoa hover:bg-cocoa hover:text-wheat transition-colors disabled:opacity-60";
const quiet = "text-[0.72rem] font-semibold text-warm-grey hover:text-cocoa underline underline-offset-2";

function formatPounds(pence: number) {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}

function formatSaleTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventTicketActions(props: Props) {
  const { eventId, pricePence, maxPerMember, salesOpenAt, availability, profileId, member } = props;
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const onSale = !salesOpenAt || new Date(salesOpenAt) <= new Date();
  const soldOut = availability.placesLeft === 0 || availability.queueOpen;
  const allowance = Math.max(maxPerMember - (member?.ticketsHeld ?? 0), 0);
  const buyable = Math.min(allowance, availability.placesLeft);

  async function call(url: string, method: "POST" | "DELETE", body: object, success: string) {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Something went wrong", "error");
        return;
      }
      toast(success);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const quantityPicker = (max: number) =>
    max > 1 ? (
      <label className="flex items-center gap-2 text-[0.75rem] text-warm-grey">
        Tickets
        <select
          value={Math.min(quantity, max)}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="rounded-lg border border-sand bg-cream px-2 py-1.5 text-[0.8rem] text-cocoa"
        >
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    ) : null;

  const priceLine = (
    <p className="text-[0.8rem] text-cocoa">
      <span className="font-display text-xl font-semibold">{formatPounds(pricePence)}</span>{" "}
      <span className="text-warm-grey">per ticket</span>
      {onSale && !soldOut && availability.placesLeft <= 5 && (
        <span className="ml-2 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ember">
          {availability.placesLeft} left
        </span>
      )}
      {onSale && soldOut && (
        <span className="ml-2 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ember">Sold out</span>
      )}
    </p>
  );

  // ── Signed out: everything needs an account (terms & health statement) ──
  if (!profileId) {
    const label = !onSale ? "Log in to get notified" : soldOut ? "Log in to join the waitlist" : "Log in to buy tickets";
    return (
      <div className="space-y-3">
        {priceLine}
        {!onSale && salesOpenAt && (
          <p className="text-[0.75rem] text-warm-grey">Tickets on sale {formatSaleTime(salesOpenAt)}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/login" className={primary}>
            {label}
          </Link>
          <Link href="/signup" className={quiet}>
            New here? Create an account
          </Link>
        </div>
      </div>
    );
  }

  const held = member?.ticketsHeld ?? 0;
  const heldNote =
    held > 0 ? (
      <p className="text-[0.75rem] font-semibold text-gold">
        You have {held} ticket{held === 1 ? "" : "s"} ·{" "}
        <Link href="/account/events" className="underline underline-offset-2">
          manage
        </Link>
      </p>
    ) : null;

  // ── A waitlist offer is being held for them ──
  if (member?.waitlist?.status === "offered") {
    return (
      <div className="space-y-3">
        {priceLine}
        {heldNote}
        <p className="text-[0.8rem] text-cocoa">
          {member.waitlist.quantity === 1 ? "A place is" : `${member.waitlist.quantity} places are`} being held for you.
        </p>
        <Link href={`/events/claim/${member.waitlist.claimToken}`} className={primary}>
          Claim my tickets
        </Link>
      </div>
    );
  }

  // ── Not on sale yet ──
  if (!onSale && salesOpenAt) {
    return (
      <div className="space-y-3">
        {priceLine}
        <p className="text-[0.75rem] text-warm-grey">Tickets on sale {formatSaleTime(salesOpenAt)}</p>
        {member?.alertRequested ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[0.78rem] font-semibold text-gold">We&apos;ll email you when they go on sale.</p>
            <button
              disabled={busy}
              onClick={() => call("/api/events/alerts", "DELETE", { event_id: eventId }, "Notification cancelled")}
              className={quiet}
            >
              Undo
            </button>
          </div>
        ) : (
          <button
            disabled={busy}
            onClick={() =>
              call("/api/events/alerts", "POST", { event_id: eventId }, "We'll email you when tickets go on sale")
            }
            className={primary}
          >
            Notify me
          </button>
        )}
      </div>
    );
  }

  // ── Already queueing ──
  if (member?.waitlist?.status === "waiting") {
    return (
      <div className="space-y-3">
        {priceLine}
        {heldNote}
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[0.78rem] font-semibold text-cocoa">
            You&apos;re on the waitlist for {member.waitlist.quantity} ticket{member.waitlist.quantity === 1 ? "" : "s"}.
            We&apos;ll email you if places open up.
          </p>
          <button
            disabled={busy}
            onClick={() => call("/api/events/waitlist", "DELETE", { event_id: eventId }, "You've left the waitlist")}
            className={quiet}
          >
            Leave waitlist
          </button>
        </div>
      </div>
    );
  }

  // ── At their per-person limit ──
  if (allowance === 0) {
    return (
      <div className="space-y-3">
        {priceLine}
        {heldNote}
      </div>
    );
  }

  // ── Sold out: join the queue ──
  if (soldOut || buyable === 0) {
    return (
      <div className="space-y-3">
        {priceLine}
        {heldNote}
        <div className="flex flex-wrap items-center gap-3">
          {quantityPicker(allowance)}
          <button
            disabled={busy}
            onClick={() =>
              call(
                "/api/events/waitlist",
                "POST",
                { event_id: eventId, quantity: Math.min(quantity, allowance) },
                "You're on the waitlist"
              )
            }
            className={secondary}
          >
            Join waitlist
          </button>
        </div>
      </div>
    );
  }

  // ── On sale ──
  return (
    <div className="space-y-3">
      {priceLine}
      {heldNote}
      <div className="flex flex-wrap items-center gap-3">
        {quantityPicker(buyable)}
        <button onClick={() => setCheckoutOpen(true)} className={primary}>
          {held > 0 ? "Buy more" : "Buy tickets"}
        </button>
      </div>
      {checkoutOpen && (
        <CheckoutModal
          type="event_ticket"
          eventId={eventId}
          quantity={Math.min(quantity, buyable)}
          profileId={profileId}
          onClose={() => {
            setCheckoutOpen(false);
            router.refresh();
          }}
          onSuccess={() => {
            setCheckoutOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
