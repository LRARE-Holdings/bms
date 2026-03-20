export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import type { CheckoutType } from "@/lib/types";

export const metadata = {
  title: "Payment Successful | Burn Mat Studio",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAuth();
  const params = await searchParams;
  const type = (params.type || "dropin") as CheckoutType;

  const config = {
    dropin: {
      title: "Class booked",
      message: "Your class is confirmed. See you on the mat.",
      href: "/account/bookings",
      label: "View bookings",
    },
    pack: {
      title: "Pack purchased",
      message: "Your class pack is ready to use.",
      href: "/account/packs",
      label: "View packs",
    },
    membership: {
      title: "Membership active",
      message: "Your membership is now active. You can book classes at no extra cost.",
      href: "/account/membership",
      label: "View membership",
    },
  }[type];

  return (
    <section className="py-10 px-5 md:px-10 max-w-[520px]">
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gold/10 rounded-full mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C4A95A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold text-cocoa mb-2">
          {config.title}
        </h1>
        <p className="text-[0.88rem] text-warm-grey mb-6">{config.message}</p>
        <Link
          href={config.href}
          className="inline-block px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
        >
          {config.label}
        </Link>
      </div>
    </section>
  );
}
