"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export interface EventTicketRow {
  id: string;
  quantity: number;
  amountPence: number;
  status: "confirmed" | "cancelled";
  cancelledBy: "member" | "studio" | "stripe" | null;
  refunded: boolean;
  eventTitle: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  eventCancelled: boolean;
  upcoming: boolean;
}

export interface EventWaitlistRow {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  quantity: number;
  status: "waiting" | "offered";
  claimToken: string;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatPounds(pence: number) {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}

function statusLabel(t: EventTicketRow) {
  if (t.eventCancelled) return t.refunded ? "Event cancelled · refunded" : "Event cancelled";
  if (t.status === "confirmed") return t.upcoming ? "Confirmed" : "Attended";
  if (t.refunded) return "Cancelled · refunded";
  return t.cancelledBy === "member" ? "Cancelled by you" : "Cancelled";
}

export default function EventTicketList({
  tickets,
  waitlist,
}: {
  tickets: EventTicketRow[];
  waitlist: EventWaitlistRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState<EventTicketRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(url: string, method: "POST" | "DELETE", body: object, success: string) {
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
        return false;
      }
      toast(success);
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {waitlist.map((w) => (
        <div key={w.id} className="bg-white border border-sand rounded-2xl p-5 flex flex-wrap items-center gap-4 justify-between">
          <div>
            <p className="text-[0.66rem] font-semibold tracking-[0.12em] uppercase text-gold mb-1">
              {w.status === "offered" ? "Places held for you" : "Waitlist"}
            </p>
            <p className="font-display text-lg font-semibold text-cocoa">{w.eventTitle}</p>
            <p className="text-[0.78rem] text-warm-grey">
              {formatDate(w.eventDate)} · {w.quantity} ticket{w.quantity === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {w.status === "offered" && (
              <Link
                href={`/events/claim/${w.claimToken}`}
                className="px-6 py-2.5 rounded-full bg-gold text-cocoa text-[0.72rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
              >
                Claim
              </Link>
            )}
            <button
              disabled={busy}
              onClick={() => post("/api/events/waitlist", "DELETE", { event_id: w.eventId }, "You've left the waitlist")}
              className="text-[0.72rem] font-semibold text-warm-grey hover:text-cocoa underline underline-offset-2"
            >
              {w.status === "offered" ? "No thanks" : "Leave waitlist"}
            </button>
          </div>
        </div>
      ))}

      {tickets.map((t) => (
        <div
          key={t.id}
          className={`bg-white border border-sand rounded-2xl p-5 flex flex-wrap items-center gap-4 justify-between ${
            t.status === "confirmed" && t.upcoming && !t.eventCancelled ? "" : "opacity-70"
          }`}
        >
          <div>
            <p className="text-[0.66rem] font-semibold tracking-[0.12em] uppercase text-gold mb-1">{statusLabel(t)}</p>
            <p className="font-display text-lg font-semibold text-cocoa">{t.eventTitle}</p>
            <p className="text-[0.78rem] text-warm-grey">
              {formatDate(t.eventDate)}
              {t.startTime && ` · ${t.startTime.slice(0, 5)}${t.endTime ? `–${t.endTime.slice(0, 5)}` : ""}`}
              {t.location && ` · ${t.location}`}
            </p>
            <p className="text-[0.78rem] text-warm-grey">
              {t.quantity} ticket{t.quantity === 1 ? "" : "s"} · {formatPounds(t.amountPence)}
            </p>
          </div>
          {t.status === "confirmed" && t.upcoming && !t.eventCancelled && (
            <button
              disabled={busy}
              onClick={() => setConfirming(t)}
              className="text-[0.72rem] font-semibold text-warm-grey hover:text-ember underline underline-offset-2"
            >
              Cancel tickets
            </button>
          )}
        </div>
      ))}

      {confirming && (
        <div
          className="fixed inset-0 bg-charcoal/55 backdrop-blur-sm z-[1100] flex items-center justify-center p-4"
          onClick={() => !busy && setConfirming(null)}
        >
          <div className="bg-white rounded-2xl w-full max-w-[420px] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold text-cocoa mb-2">Cancel your tickets?</h3>
            <p className="text-[0.85rem] text-cocoa mb-2">
              {confirming.quantity === 1 ? "Your ticket" : `Your ${confirming.quantity} tickets`} for{" "}
              <strong>{confirming.eventTitle}</strong> will be cancelled and the place
              {confirming.quantity === 1 ? "" : "s"} offered to someone else.
            </p>
            <p className="text-[0.8rem] text-cocoa bg-gold/10 border border-gold/30 rounded-xl p-3 mb-5">
              You&apos;ll get a full refund of {formatPounds(confirming.amountPence)} to the card you paid with. It
              usually takes 5–10 working days to appear.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                disabled={busy}
                onClick={() => setConfirming(null)}
                className="px-5 py-2 rounded-full border border-sand text-[0.72rem] font-semibold tracking-[0.05em] uppercase text-warm-grey hover:bg-cream transition-colors"
              >
                Keep tickets
              </button>
              <button
                disabled={busy}
                onClick={async () => {
                  const ok = await post(
                    "/api/events/tickets/cancel",
                    "POST",
                    { ticket_id: confirming.id },
                    "Tickets cancelled — your refund is on its way"
                  );
                  if (ok) setConfirming(null);
                }}
                className="px-5 py-2 rounded-full bg-cocoa text-wheat text-[0.72rem] font-semibold tracking-[0.05em] uppercase hover:bg-ember transition-colors disabled:opacity-60"
              >
                {busy ? "Cancelling…" : "Cancel tickets"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
