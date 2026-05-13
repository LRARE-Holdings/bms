"use client";

import { useEffect, useState } from "react";
import { formatUKPhoneDisplay } from "@/lib/phone-utils";

interface MemberDetail {
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    date_of_birth: string | null;
    role: string;
    joined_at: string;
  };
  stats: {
    total: number;
    last30: number;
    favourite_class: string | null;
  };
  recent_bookings: {
    id: string;
    date: string;
    status: string;
    payment_method: string;
    class_name: string;
    instructor_name: string;
    start_time: string | null;
  }[];
}

function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDOB(dob: string | null): string {
  if (!dob) return "—";
  const d = new Date(dob);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatBookingDate(date: string, start_time: string | null): string {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  if (!start_time) return dateStr;
  return `${dateStr} · ${start_time.slice(0, 5)}`;
}

function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function MemberProfileModal({
  profileId,
  onClose,
}: {
  profileId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<MemberDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/members/${profileId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Failed to load");
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const age = data ? calculateAge(data.profile.date_of_birth) : null;

  return (
    <div
      className="fixed inset-0 bg-charcoal/70 backdrop-blur-md z-[2500] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-3xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-up"
        style={{ animationDuration: "0.3s" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-7 pt-7 pb-5 bg-cocoa text-wheat">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-wheat/70 hover:text-wheat hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <p className="text-[0.62rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
            Member profile
          </p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-display text-xl font-medium">
              {initials(data?.profile.full_name ?? null)}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-2xl text-wheat truncate">
                {data?.profile.full_name || (error ? "—" : "Loading…")}
              </h2>
              {data && (
                <p className="text-[0.74rem] text-wheat/70 mt-0.5">
                  {data.profile.role === "admin"
                    ? "Admin"
                    : data.profile.role === "staff"
                      ? "Staff"
                      : "Member"}{" "}
                  · joined {formatJoined(data.profile.joined_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="px-7 py-6 text-[0.85rem] text-ember">
            Couldn&apos;t load member: {error}
          </div>
        )}

        {data && (
          <>
            {/* Personal details */}
            <div className="px-7 py-5 border-b border-sand">
              <p className="text-[0.62rem] font-semibold tracking-[0.18em] uppercase text-gold mb-3">
                Personal
              </p>
              <dl className="space-y-2.5">
                <DetailRow label="Date of birth" value={formatDOB(data.profile.date_of_birth)} sub={age !== null ? `${age} years old` : null} />
                <DetailRow
                  label="Phone"
                  value={
                    data.profile.phone
                      ? formatUKPhoneDisplay(data.profile.phone)
                      : "—"
                  }
                  href={data.profile.phone ? `tel:${data.profile.phone}` : null}
                />
                <DetailRow
                  label="Email"
                  value={data.profile.email || "—"}
                  href={data.profile.email ? `mailto:${data.profile.email}` : null}
                />
              </dl>
            </div>

            {/* Stats */}
            <div className="px-7 py-5 border-b border-sand">
              <p className="text-[0.62rem] font-semibold tracking-[0.18em] uppercase text-gold mb-3">
                Attendance
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Total classes" value={String(data.stats.total)} />
                <Stat label="Last 30 days" value={String(data.stats.last30)} />
                <Stat
                  label="Favourite"
                  value={data.stats.favourite_class || "—"}
                  small
                />
              </div>
            </div>

            {/* Recent activity */}
            <div className="px-7 py-5">
              <p className="text-[0.62rem] font-semibold tracking-[0.18em] uppercase text-gold mb-3">
                Recent activity
              </p>
              {data.recent_bookings.length === 0 ? (
                <p className="text-[0.82rem] text-warm-grey py-3">
                  No bookings yet.
                </p>
              ) : (
                <ul className="divide-y divide-sand">
                  {data.recent_bookings.map((b) => (
                    <li key={b.id} className="py-2.5 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.85rem] font-semibold text-cocoa truncate">
                          {b.class_name}
                        </p>
                        <p className="text-[0.72rem] text-warm-grey mt-0.5">
                          {formatBookingDate(b.date, b.start_time)} · {b.instructor_name}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[0.62rem] font-semibold tracking-[0.08em] uppercase px-2 py-1 rounded-full ${
                          b.status === "cancelled"
                            ? "bg-ember/10 text-ember"
                            : "bg-gold/15 text-gold"
                        }`}
                      >
                        {b.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string | null;
  href?: string | null;
}) {
  return (
    <div className="flex items-baseline gap-4">
      <dt className="w-28 shrink-0 text-[0.7rem] font-semibold tracking-[0.06em] uppercase text-warm-grey">
        {label}
      </dt>
      <dd className="flex-1 text-[0.88rem] text-cocoa min-w-0">
        {href ? (
          <a href={href} className="text-cocoa hover:text-gold transition-colors break-words">
            {value}
          </a>
        ) : (
          <span className="break-words">{value}</span>
        )}
        {sub && <span className="text-warm-grey text-[0.74rem] ml-2">· {sub}</span>}
      </dd>
    </div>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white border border-sand rounded-2xl px-3 py-3">
      <p
        className={`font-display font-medium text-cocoa leading-tight ${
          small ? "text-[0.95rem]" : "text-2xl"
        } truncate`}
        title={value}
      >
        {value}
      </p>
      <p className="text-[0.6rem] font-semibold tracking-[0.1em] uppercase text-warm-grey mt-1">
        {label}
      </p>
    </div>
  );
}
