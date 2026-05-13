"use client";

import { useMemo, useState } from "react";
import { useMemberProfile } from "@/components/member-profile/member-profile-context";
import { formatUKPhoneDisplay } from "@/lib/phone-utils";

interface MemberRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  joined_at: string;
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
  return new Date(dob).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MembersTable({ members }: { members: MemberRow[] }) {
  const { open } = useMemberProfile();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      return (
        (m.full_name ?? "").toLowerCase().includes(q) ||
        (m.email ?? "").toLowerCase().includes(q) ||
        (m.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [members, query]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or phone"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-sand rounded-xl text-[0.85rem] text-cocoa placeholder:text-warm-grey/60 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-grey"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p className="text-[0.74rem] text-warm-grey">
          {filtered.length} of {members.length}
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-sand rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-sand bg-cream/60">
              <th className="px-5 py-3 text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-warm-grey">
                Name
              </th>
              <th className="px-5 py-3 text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-warm-grey">
                Email
              </th>
              <th className="px-5 py-3 text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-warm-grey">
                Phone
              </th>
              <th className="px-5 py-3 text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-warm-grey">
                DOB
              </th>
              <th className="px-5 py-3 text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-warm-grey">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const age = calculateAge(m.date_of_birth);
              return (
                <tr
                  key={m.id}
                  onClick={() => open(m.id)}
                  className="border-b border-sand last:border-b-0 cursor-pointer hover:bg-cream/40 transition-colors"
                >
                  <td className="px-5 py-3.5 text-[0.85rem] font-semibold text-cocoa">
                    {m.full_name || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[0.8rem] text-warm-grey">
                    {m.email || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[0.8rem] text-warm-grey">
                    {m.phone ? formatUKPhoneDisplay(m.phone) : (
                      <span className="text-ember/70">Missing</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-[0.8rem] text-warm-grey">
                    {formatDOB(m.date_of_birth)}
                    {age !== null && (
                      <span className="text-warm-grey/70 ml-1.5">· {age}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-[0.8rem] text-warm-grey">
                    {formatJoined(m.joined_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-5 py-8 text-[0.85rem] text-warm-grey text-center">
            No members match your search.
          </p>
        )}
      </div>

      {/* Mobile list */}
      <div className="md:hidden space-y-2">
        {filtered.map((m) => {
          const age = calculateAge(m.date_of_birth);
          return (
            <button
              key={m.id}
              onClick={() => open(m.id)}
              className="w-full text-left bg-white border border-sand rounded-2xl px-4 py-3 hover:border-gold/40 active:scale-[0.99] transition-all"
            >
              <p className="text-[0.88rem] font-semibold text-cocoa">
                {m.full_name || "—"}
              </p>
              <p className="text-[0.74rem] text-warm-grey mt-0.5">
                {m.email || "—"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] text-warm-grey">
                {m.phone ? (
                  <span>{formatUKPhoneDisplay(m.phone)}</span>
                ) : (
                  <span className="text-ember/70">No phone</span>
                )}
                <span>
                  DOB: {formatDOB(m.date_of_birth)}
                  {age !== null && ` · ${age}`}
                </span>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-[0.85rem] text-warm-grey text-center">
            No members match your search.
          </p>
        )}
      </div>
    </div>
  );
}
