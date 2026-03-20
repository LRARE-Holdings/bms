"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "bms_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if the user hasn't already responded
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4"
    >
      <div className="mx-auto max-w-xl rounded-2xl border border-sand bg-white/95 backdrop-blur-sm shadow-lg px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <p className="text-[0.8rem] leading-relaxed text-slate flex-1">
          We use essential cookies to keep you logged in and process bookings.
          No tracking or advertising cookies.{" "}
          <Link
            href="/cookies"
            className="text-gold underline underline-offset-2 hover:text-cocoa transition-colors"
          >
            Learn more
          </Link>
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-3.5 py-1.5 rounded-full text-[0.7rem] font-semibold tracking-[0.05em] uppercase text-warm-grey hover:text-cocoa border border-sand hover:border-cocoa/20 transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-3.5 py-1.5 rounded-full text-[0.7rem] font-semibold tracking-[0.05em] uppercase bg-cocoa text-wheat hover:bg-gold hover:text-cocoa transition-colors cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
