import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-charcoal pt-12 pb-6 px-5 md:px-8">
      <div className="max-w-275 mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8">
        {/* Brand column */}
        <div>
          <Image
            src="/Logo_Beige.png"
            alt="Burn Mat Studio"
            width={44}
            height={44}
            className="rounded-full mb-3"
          />
          <div className="font-display text-xl font-semibold text-wheat mb-1.5">
            Burn Mat Studio
          </div>
          <p className="text-[0.78rem] text-warm-grey leading-relaxed max-w-62.5">
            Boutique Pilates &amp; yoga in Stockton-on-Tees. Small classes, big
            results. Move, breathe, burn.
          </p>
        </div>

        {/* Studio links */}
        <div>
          <h4 className="text-[0.62rem] font-semibold tracking-[0.15em] uppercase text-warm-grey mb-3">
            Studio
          </h4>
          <div className="flex flex-col gap-1.5">
            <Link
              href="/#classes"
              className="text-[0.8rem] text-sand hover:text-gold transition-colors"
            >
              Classes
            </Link>
            <Link
              href="/#timetable"
              className="text-[0.8rem] text-sand hover:text-gold transition-colors"
            >
              Timetable
            </Link>
            <Link
              href="/#pricing"
              className="text-[0.8rem] text-sand hover:text-gold transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/#team"
              className="text-[0.8rem] text-sand hover:text-gold transition-colors"
            >
              Team
            </Link>
          </div>
        </div>

        {/* Account links */}
        <div>
          <h4 className="text-[0.62rem] font-semibold tracking-[0.15em] uppercase text-warm-grey mb-3">
            Account
          </h4>
          <div className="flex flex-col gap-1.5">
            <Link
              href="/login"
              className="text-[0.8rem] text-sand hover:text-gold transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-[0.8rem] text-sand hover:text-gold transition-colors"
            >
              Sign up
            </Link>
            <Link
              href="/account"
              className="text-[0.8rem] text-sand hover:text-gold transition-colors"
            >
              My bookings
            </Link>
          </div>
        </div>

        {/* Connect */}
        <div>
          <h4 className="text-[0.62rem] font-semibold tracking-[0.15em] uppercase text-warm-grey mb-3">
            Connect
          </h4>
          <div className="flex flex-col gap-1.5">
            <a
              href="mailto:hello@burnmatstudio.co.uk"
              className="text-[0.8rem] text-sand hover:text-gold transition-colors"
            >
              Email us
            </a>
            <a
              href="https://instagram.com/burnmatstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.8rem] text-sand hover:text-gold transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Burn+Mat+Studio+TS16+0TA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.8rem] text-sand hover:text-gold transition-colors"
            >
              Get to us
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-275 mx-auto mt-6 pt-5 border-t border-white/6 flex flex-col sm:flex-row justify-between gap-2 text-[0.7rem] text-warm-grey">
        <span>&copy; {new Date().getFullYear()} Burn Mat Studio. All rights reserved.</span>
        <div className="flex gap-3">
          <Link href="/privacy" className="hover:text-gold transition-colors">
            Privacy Policy
          </Link>
          <span>&middot;</span>
          <Link href="/terms" className="hover:text-gold transition-colors">
            Terms
          </Link>
          <span>&middot;</span>
          <Link href="/cookies" className="hover:text-gold transition-colors">
            Cookies
          </Link>
        </div>
      </div>

      {/* Powered by */}
      <div className="max-w-275 mx-auto mt-4 text-center text-[0.62rem] text-warm-grey/60">
        Powered by{" "}
        <a
          href="https://www.useforma.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gold transition-colors"
        >
          Forma
        </a>
      </div>
    </footer>
  );
}
