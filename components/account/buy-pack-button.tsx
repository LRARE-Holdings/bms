"use client";

import { useState } from "react";

export default function BuyPackButton({
  packType,
  className,
  children,
}: {
  packType: "5" | "10";
  className?: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_type: packType }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${className} disabled:opacity-60`}
      >
        {loading ? "Redirecting…" : children}
      </button>
      {error && (
        <p className="text-[0.72rem] text-ember mt-1.5 text-center">{error}</p>
      )}
    </>
  );
}
