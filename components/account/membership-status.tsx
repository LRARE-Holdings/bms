import Link from "next/link";

interface MembershipWithTier {
  id: string;
  status: string;
  current_period_end: string | null;
  cancelled_at: string | null;
  membership_tiers: {
    name: string;
    description: string;
    price_pence: number;
    interval: string;
    interval_count: number;
  } | null;
}

export default function MembershipStatus({
  membership,
}: {
  membership: MembershipWithTier;
}) {
  const tier = membership.membership_tiers;
  const periodEnd = membership.current_period_end
    ? new Date(membership.current_period_end)
    : null;
  const periodEndStr = periodEnd?.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isCancelled = !!membership.cancelled_at;

  const intervalLabel = tier
    ? tier.interval_count > 1
      ? `every ${tier.interval_count} ${tier.interval}s`
      : `per ${tier.interval}`
    : "";

  return (
    <div className="bg-white border border-sand rounded-2xl p-6">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-display text-xl font-semibold text-cocoa">
          {tier?.name || "Membership"}
        </h3>
        <span
          className={`text-[0.66rem] font-semibold tracking-[0.08em] uppercase ${
            isCancelled ? "text-ember" : "text-gold"
          }`}
        >
          {isCancelled ? "Cancelling" : "Active"}
        </span>
      </div>

      {tier && (
        <p className="text-[0.84rem] text-warm-grey mb-3">
          &pound;{(tier.price_pence / 100).toFixed(2)} {intervalLabel}
        </p>
      )}

      {periodEndStr && (
        <p className="text-[0.78rem] text-warm-grey mb-4">
          {isCancelled
            ? `Active until ${periodEndStr}`
            : `Next billing date: ${periodEndStr}`}
        </p>
      )}

      <Link
        href="/account/billing"
        className="inline-block px-6 py-2 bg-gold text-cocoa rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
      >
        Manage subscription
      </Link>
    </div>
  );
}
