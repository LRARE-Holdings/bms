import Link from "next/link";
import type { ClassPackWithTier } from "@/lib/types";

export default function PackStatus({ packs }: { packs: ClassPackWithTier[] }) {
  if (packs.length === 0) {
    return (
      <div className="bg-white border border-sand rounded-2xl p-8 text-center">
        <p className="text-[0.88rem] text-warm-grey mb-3">
          No active class pack.
        </p>
        <Link
          href="/account/packs"
          className="inline-block px-6 py-2 bg-gold text-cocoa rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
        >
          Buy a pack
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {packs.map((pack) => {
        const expiresDate = new Date(pack.expires_at);
        const expiresStr = expiresDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const packName =
          pack.pack_tiers?.name ||
          (pack.pack_type ? `${pack.pack_type} Class Pack` : "Class Pack");

        return (
          <div
            key={pack.id}
            className="bg-white border border-sand rounded-2xl p-5"
          >
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="font-display text-lg font-semibold text-cocoa">
                {packName}
              </h3>
              <span className="text-[0.66rem] font-semibold tracking-[0.08em] uppercase text-gold">
                Active
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-display text-3xl font-normal text-cocoa">
                {pack.credits_remaining}
              </span>
              <span className="text-[0.78rem] text-warm-grey">
                / {pack.credits_total} credits
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-sand rounded-full mb-2">
              <div
                className="h-1.5 bg-gold rounded-full transition-all"
                style={{
                  width: `${(pack.credits_remaining / pack.credits_total) * 100}%`,
                }}
              />
            </div>
            <p className="text-[0.72rem] text-warm-grey">
              Expires {expiresStr}
            </p>
          </div>
        );
      })}
    </div>
  );
}
