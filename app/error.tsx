"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-ember/10 flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ember"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold text-cocoa mb-2">
          Something went wrong
        </h1>
        <p className="text-[0.88rem] text-warm-grey leading-relaxed mb-6">
          We hit an unexpected error. Please try again, or contact us if the
          problem persists.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-gold text-cocoa rounded-full text-[0.75rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 border border-sand text-cocoa rounded-full text-[0.75rem] font-semibold tracking-[0.06em] uppercase hover:bg-cream transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
