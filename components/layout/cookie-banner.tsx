"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "bms_cookie_consent";

export default function CookieBanner() {
  // Start hidden — only show after hydration confirms no consent stored.
  // This avoids SSR→client mismatch and prevents CLS from the banner sliding in.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
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

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-hidden={!visible}
      className={`fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 transition-all duration-400 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
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
            className="px-3.5 py-1.5 rounded-full text-[0.7rem] font-semibold tracking-[0.05em] uppercase text-warm-grey hover:text-cocoa border border-sand hover:border-cocoa/20 active:scale-95 transition-all cursor-pointer"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-3.5 py-1.5 rounded-full text-[0.7rem] font-semibold tracking-[0.05em] uppercase bg-cocoa text-wheat hover:bg-gold hover:text-cocoa active:scale-95 transition-all cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
