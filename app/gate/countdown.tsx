"use client";

import { useEffect, useState } from "react";

const LAUNCH_TIME = new Date("2026-04-01T10:00:00Z").getTime();

function calcTimeLeft() {
  const diff = Math.max(0, LAUNCH_TIME - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff <= 0,
  };
}

export default function Countdown() {
  const [time, setTime] = useState(calcTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      const t = calcTimeLeft();
      setTime(t);
      if (t.done) {
        clearInterval(interval);
        window.location.reload();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (time.done) return null;

  const units = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Mins", value: time.minutes },
    { label: "Secs", value: time.seconds },
  ];

  return (
    <div className="flex justify-center gap-3 mb-8">
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center">
          <span className="font-display text-3xl font-semibold text-cocoa tabular-nums w-14 text-center">
            {String(u.value).padStart(2, "0")}
          </span>
          <span className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-warm-grey mt-1">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}
