"use client";

import { useState, useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * Share buttons for an event page. Instagram has no share URL, so "Copy link"
 * is the way to get an event into a story or bio; on phones the native share
 * sheet covers every app.
 */
export default function EventShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  // The server has no navigator: it renders without the Share button, and the
  // browser adds it after hydration if the device has a share sheet.
  const canNativeShare = useSyncExternalStore(
    noSubscription,
    () => typeof navigator.share === "function",
    () => false
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // Cancelled by the user — nothing to do.
    }
  }

  const text = encodeURIComponent(title);
  const link = encodeURIComponent(url);
  const pill =
    "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sand bg-white text-[0.72rem] font-semibold tracking-[0.04em] text-cocoa hover:border-gold hover:text-gold transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={copy} className={pill}>
        {copied ? "Link copied" : "Copy link"}
      </button>
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={pill}>
          Share…
        </button>
      )}
      <a className={pill} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${text}%20${link}`}>
        WhatsApp
      </a>
      <a className={pill} target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${link}`}>
        Facebook
      </a>
      <a className={pill} target="_blank" rel="noopener noreferrer" href={`https://x.com/intent/post?text=${text}&url=${link}`}>
        X
      </a>
    </div>
  );
}
