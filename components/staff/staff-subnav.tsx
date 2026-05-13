"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StaffSubnav({ role }: { role: "staff" | "admin" }) {
  const pathname = usePathname();

  const items =
    role === "admin"
      ? [
          { href: "/staff", label: "Schedule" },
          { href: "/staff/members", label: "Members" },
          { href: "/staff/settings", label: "Settings" },
        ]
      : [{ href: "/staff", label: "Schedule" }];

  if (items.length <= 1) return null;

  return (
    <nav className="border-b border-sand bg-white/60">
      <div className="max-w-[900px] mx-auto px-5 md:px-8 flex gap-1 overflow-x-auto">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative py-3 px-3 text-[0.74rem] font-semibold tracking-[0.06em] uppercase transition-colors ${
                active
                  ? "text-cocoa"
                  : "text-warm-grey hover:text-cocoa"
              }`}
            >
              {it.label}
              {active && (
                <span className="absolute left-3 right-3 bottom-0 h-0.5 bg-gold rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
