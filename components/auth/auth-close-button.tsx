"use client";

import { useRouter } from "next/navigation";

export default function AuthCloseButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/")}
      className="fixed top-5 right-5 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-sand/60 text-warm-grey hover:text-cocoa hover:border-gold hover:bg-white transition-all duration-200 shadow-sm"
      aria-label="Close and return to homepage"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}
