"use client";

import { useState } from "react";

export default function SettingsToggle({
  initialValue,
}: {
  initialValue: boolean;
}) {
  const [enabled, setEnabled] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const newValue = !enabled;
    setSaving(true);

    try {
      const res = await fetch("/api/studio/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_class_free_enabled: newValue }),
      });

      if (res.ok) {
        setEnabled(newValue);
      } else {
        // Revert on failure — don't change state
        console.error("Failed to update setting");
      }
    } catch {
      console.error("Failed to update setting");
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={saving}
      onClick={handleToggle}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:opacity-50 ${
        enabled ? "bg-gold" : "bg-sand"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
