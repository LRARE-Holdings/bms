"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ClassPackWithTier } from "@/lib/types";

export default function PackStatus({ packs }: { packs: ClassPackWithTier[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  if (packs.length === 0) {
    return (
      <div className="bg-white border border-sand rounded-2xl p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path d="M20 12V8H6a2 2 0 010-4h12v4" />
            <path d="M4 6v12a2 2 0 002 2h14v-4" />
            <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
          </svg>
        </div>
        <p className="text-[0.92rem] font-semibold text-cocoa mb-1">No active pack</p>
        <p className="text-[0.82rem] text-warm-grey mb-4">
          Save on every class with a multi-class pack.
        </p>
        <Link
          href="/account/packs"
          className="inline-block px-6 py-2 bg-gold text-cocoa rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat active:scale-95 transition-all"
        >
          Buy a pack
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {packs.map((pack) => {
        const expiresDate = new Date(pack.expires_at);
        const expiresStr = expiresDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const packName =
          pack.pack_tiers?.name ||
          (pack.pack_type ? `${pack.pack_type} Class Pack` : "Class Pack");

        const pct = (pack.credits_remaining / pack.credits_total) * 100;

        const daysUntilExpiry = Math.ceil(
          (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        const isExpiringSoon = daysUntilExpiry <= 5 && daysUntilExpiry > 0;

        return (
          <div
            key={pack.id}
            className={`bg-white border rounded-2xl p-5 transition-shadow ${
              isExpiringSoon
                ? "border-ember/30 animate-[pulseGlow_3s_ease-in-out_infinite]"
                : "border-sand"
            }`}
          >
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="font-display text-lg font-semibold text-cocoa">
                {packName}
              </h3>
              <span className={`text-[0.66rem] font-semibold tracking-[0.08em] uppercase ${
                isExpiringSoon ? "text-ember" : "text-gold"
              }`}>
                {isExpiringSoon ? `${daysUntilExpiry}d left` : "Active"}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-display text-3xl font-normal text-cocoa">
                {pack.credits_remaining}
              </span>
              <span className="text-[0.78rem] text-warm-grey">
                / {pack.credits_total} credits
              </span>
            </div>
            {/* Progress bar with animated fill */}
            <div className="w-full h-1.5 bg-sand rounded-full mb-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ease-out ${
                  isExpiringSoon ? "bg-ember" : "bg-gold"
                }`}
                style={{
                  width: mounted ? `${pct}%` : "0%",
                }}
              />
            </div>
            <p className={`text-[0.72rem] ${
              isExpiringSoon ? "text-ember font-medium" : "text-warm-grey"
            }`}>
              {isExpiringSoon
                ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`
                : `Expires ${expiresStr}`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
