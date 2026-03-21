"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "#classes", label: "Classes" },
  { href: "#team", label: "Team" },
  { href: "#timetable", label: "Timetable" },
  { href: "#pricing", label: "Pricing" },
];

function useScrollPastThreshold(threshold: number): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("scroll", cb, { passive: true });
      return () => window.removeEventListener("scroll", cb);
    },
    () => window.scrollY > window.innerHeight * threshold,
    () => false,
  );
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  const isHomepage = pathname === "/";
  const scrolledPast = useScrollPastThreshold(0.85);
  const visible = !isHomepage || scrolledPast;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  function handleAnchorClick(e: React.MouseEvent, href: string) {
    e.preventDefault();
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  }

  function renderNavLink(link: { href: string; label: string }, className: string) {
    if (isHomepage) {
      return (
        <a
          key={link.href}
          href={link.href}
          onClick={(e) => handleAnchorClick(e, link.href)}
          className={className}
        >
          {link.label}
        </a>
      );
    }
    return (
      <Link
        key={link.href}
        href={`/${link.href}`}
        className={className}
      >
        {link.label}
      </Link>
    );
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-sand h-14 flex items-center justify-between px-5 md:px-8 transition-all duration-500 ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      {/* Brand wordmark */}
      {isHomepage ? (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Image
            src="/Burn_Brown.svg"
            alt="Burn Mat Studio"
            width={100}
            height={28}
            className="h-6 w-auto"
            priority
          />
        </a>
      ) : (
        <Link href="/">
          <Image
            src="/Burn_Brown.svg"
            alt="Burn Mat Studio"
            width={100}
            height={28}
            className="h-6 w-auto"
            priority
          />
        </Link>
      )}

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-7">
        {navLinks.map((link) =>
          renderNavLink(link, "text-[0.73rem] font-medium tracking-[0.06em] uppercase text-slate hover:text-gold transition-colors")
        )}
        {user ? (
          <Link
            href="/account"
            className="px-5 py-1.5 bg-cocoa text-wheat rounded-full text-[0.73rem] font-medium tracking-[0.06em] uppercase hover:bg-gold hover:text-cocoa transition-colors"
          >
            Account
          </Link>
        ) : (
          <Link
            href="/login"
            className="px-5 py-1.5 bg-cocoa text-wheat rounded-full text-[0.73rem] font-medium tracking-[0.06em] uppercase hover:bg-gold hover:text-cocoa transition-colors"
          >
            Log in
          </Link>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col gap-1 p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <span
          className={`block w-5 h-0.5 bg-cocoa transition-transform ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`}
        />
        <span
          className={`block w-5 h-0.5 bg-cocoa transition-opacity ${mobileOpen ? "opacity-0" : ""}`}
        />
        <span
          className={`block w-5 h-0.5 bg-cocoa transition-transform ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
        />
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-sand shadow-lg md:hidden z-50">
          <div className="flex flex-col p-5 gap-4">
            {navLinks.map((link) =>
              renderNavLink(link, "text-sm font-medium tracking-wider uppercase text-slate hover:text-gold transition-colors")
            )}
            <div className="border-t border-sand pt-4">
              {user ? (
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="inline-block px-6 py-2 bg-cocoa text-wheat rounded-full text-sm font-medium tracking-wider uppercase"
                >
                  Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-block px-6 py-2 bg-cocoa text-wheat rounded-full text-sm font-medium tracking-wider uppercase"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
