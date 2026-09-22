import { formatPrice } from "@/lib/pricing";

interface PriceTagProps {
  /** List price, always. Shown struck through when a discount applies. */
  pricePence: number;
  /** What the member pays for the session in question. */
  effectivePence: number;
  /** Set only when a discount covers the class being priced. */
  discountPercent?: number | null;
  /**
   * For listings with no particular date, like the homepage cards. Describes
   * the offer ("20% off in October") instead of pricing a session the visitor
   * has not chosen yet, which would either be wrong or need a date it hasn't got.
   */
  note?: string | null;
  variant?: "inline" | "badge" | "stacked";
  className?: string;
}

/**
 * One place that decides how a discounted price looks, so the timetable row,
 * the class card and the booking sheet cannot drift apart mid-promotion.
 *
 * Ember is the studio's one warm accent and goes unused elsewhere on these
 * surfaces, so it marks the saving without introducing a colour the rest of the
 * site does not speak.
 */
export default function PriceTag({
  pricePence,
  effectivePence,
  discountPercent,
  note,
  variant = "inline",
  className = "",
}: PriceTagProps) {
  const discounted = Boolean(discountPercent) && effectivePence < pricePence;

  if (variant === "badge") {
    if (discounted) {
      return (
        <span className={`flex items-center gap-1.5 ${className}`}>
          <span className="bg-ember text-white text-[0.6rem] font-semibold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full">
            {discountPercent}% off
          </span>
          <span className="flex items-center gap-1 bg-cocoa text-wheat text-[0.7rem] font-semibold px-2.5 py-0.5 rounded-full">
            <s className="text-wheat/55 font-normal">{formatPrice(pricePence)}</s>
            {formatPrice(effectivePence)}
          </span>
        </span>
      );
    }

    return (
      <span className={`flex flex-col items-end gap-1 ${className}`}>
        <span className="bg-cocoa text-wheat text-[0.7rem] font-semibold px-2.5 py-0.5 rounded-full">
          {formatPrice(pricePence)}
        </span>
        {note && (
          <span className="bg-ember text-white text-[0.55rem] font-semibold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full whitespace-nowrap">
            {note}
          </span>
        )}
      </span>
    );
  }

  if (variant === "stacked") {
    return (
      <span className={`flex flex-col items-end leading-tight ${className}`}>
        {discounted && (
          <s className="text-[0.7rem] text-warm-grey">{formatPrice(pricePence)}</s>
        )}
        <span className="font-semibold text-cocoa">
          {formatPrice(effectivePence)}
        </span>
        {discounted && (
          <span className="text-[0.6rem] font-semibold tracking-[0.08em] uppercase text-ember">
            {discountPercent}% off
          </span>
        )}
      </span>
    );
  }

  if (discounted) {
    return (
      <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
        <s className="text-warm-grey font-normal">{formatPrice(pricePence)}</s>
        <span className="text-ember">{formatPrice(effectivePence)}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      {formatPrice(pricePence)}
      {note && (
        <span className="text-[0.6rem] font-semibold tracking-[0.08em] uppercase text-ember whitespace-nowrap">
          {note}
        </span>
      )}
    </span>
  );
}
