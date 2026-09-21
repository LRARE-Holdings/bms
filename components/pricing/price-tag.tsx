import { formatPrice } from "@/lib/pricing";

interface PriceTagProps {
  /** List price, always. Shown struck through when a discount is running. */
  pricePence: number;
  /** What the member actually pays today. */
  effectivePence: number;
  /** Null when nothing is running, which renders the plain list price. */
  discountPercent?: number | null;
  variant?: "inline" | "badge" | "stacked";
  className?: string;
}

/**
 * One place that decides how a discounted price looks, so the timetable row, the
 * class card and the booking sheet cannot drift apart mid-promotion.
 *
 * Ember is the studio's one warm accent and goes unused elsewhere on these
 * surfaces, so it marks the saving without introducing a colour the rest of the
 * site does not speak.
 */
export default function PriceTag({
  pricePence,
  effectivePence,
  discountPercent,
  variant = "inline",
  className = "",
}: PriceTagProps) {
  const discounted = Boolean(discountPercent) && effectivePence < pricePence;

  if (variant === "badge") {
    // Sits over the class card artwork, so it carries its own background.
    if (!discounted) {
      return (
        <span
          className={`bg-cocoa text-wheat text-[0.7rem] font-semibold px-2.5 py-0.5 rounded-full ${className}`}
        >
          {formatPrice(pricePence)}
        </span>
      );
    }

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

  if (!discounted) {
    return <span className={className}>{formatPrice(pricePence)}</span>;
  }

  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <s className="text-warm-grey font-normal">{formatPrice(pricePence)}</s>
      <span className="text-ember">{formatPrice(effectivePence)}</span>
    </span>
  );
}
