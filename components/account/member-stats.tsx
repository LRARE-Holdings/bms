interface MemberStatsProps {
  totalClasses: number;
  weekStreak: number;
  creditsRemaining: number;
  creditsExpiringSoon: number;
  daysUntilExpiry: number | null;
}

export default function MemberStats({
  totalClasses,
  weekStreak,
  creditsRemaining,
  creditsExpiringSoon,
  daysUntilExpiry,
}: MemberStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {/* Total classes */}
      <div className="bg-white border border-sand rounded-xl p-4 text-center">
        <span className="font-display text-2xl font-normal text-cocoa block">
          {totalClasses}
        </span>
        <span className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-warm-grey">
          Classes taken
        </span>
      </div>

      {/* Streak */}
      <div className="bg-white border border-sand rounded-xl p-4 text-center">
        <span className="font-display text-2xl font-normal text-cocoa block">
          {weekStreak}
        </span>
        <span className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-warm-grey">
          Week streak
        </span>
      </div>

      {/* Credits */}
      <div className="bg-white border border-sand rounded-xl p-4 text-center">
        <span className={`font-display text-2xl font-normal block ${
          creditsRemaining > 0 ? "text-cocoa" : "text-warm-grey"
        }`}>
          {creditsRemaining}
        </span>
        <span className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-warm-grey">
          Pack credits
        </span>
      </div>

      {/* Expiry warning or upcoming */}
      <div className={`border rounded-xl p-4 text-center ${
        creditsExpiringSoon > 0 && daysUntilExpiry !== null && daysUntilExpiry <= 5
          ? "bg-ember/[0.06] border-ember/20"
          : "bg-white border-sand"
      }`}>
        {creditsExpiringSoon > 0 && daysUntilExpiry !== null && daysUntilExpiry <= 7 ? (
          <>
            <span className="font-display text-2xl font-normal text-ember block">
              {daysUntilExpiry}d
            </span>
            <span className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-ember">
              Until expiry
            </span>
          </>
        ) : (
          <>
            <span className="font-display text-2xl font-normal text-cocoa block">
              {creditsExpiringSoon}
            </span>
            <span className="text-[0.66rem] font-semibold tracking-[0.1em] uppercase text-warm-grey">
              Expiring soon
            </span>
          </>
        )}
      </div>
    </div>
  );
}
