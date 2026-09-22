/**
 * What a class costs on the day it runs.
 *
 * A discount covers a range of CLASS DATES, not a window in which you have to
 * book. The timetable opens weeks ahead, so someone booking in September for a
 * class on 5 October pays October's price today. Keying this off the current
 * date instead would quote full price right up to the 1st and then change under
 * people who had already booked.
 *
 * `price_pence` stays the list price. The discount is a dated overlay set in
 * forma-admin, so it lapses on its own and the original price survives.
 *
 * These rules match forma-admin's `lib/pricing.ts` and the
 * `class_price_on(date)` function. All three have to agree, or the site will
 * show one price and charge another.
 */

export interface DiscountableClass {
  price_pence: number;
  discount_percent?: number | null;
  discount_starts_on?: string | null;
  discount_ends_on?: string | null;
}

/**
 * Does the discount cover a class running on `classDate` (YYYY-MM-DD)?
 *
 * The date is required on purpose. An optional one defaulting to today is the
 * exact bug this replaced, and it would come back silently at the first call
 * site that forgot to pass a date.
 */
export function isDiscountActiveOn(
  cls: DiscountableClass,
  classDate: string
): boolean {
  if (!cls.discount_percent) return false;
  if (cls.discount_starts_on && classDate < cls.discount_starts_on) return false;
  if (cls.discount_ends_on && classDate > cls.discount_ends_on) return false;
  return true;
}

/** The amount to charge for a class running on `classDate`. */
export function effectivePricePence(
  cls: DiscountableClass,
  classDate: string
): number {
  if (!isDiscountActiveOn(cls, classDate)) return cls.price_pence;
  return Math.round((cls.price_pence * (100 - cls.discount_percent!)) / 100);
}

/** Percentage to show for a class on `classDate`, or null when none applies. */
export function discountPercentOn(
  cls: DiscountableClass,
  classDate: string
): number | null {
  return isDiscountActiveOn(cls, classDate) ? cls.discount_percent ?? null : null;
}

/**
 * For places that list a class with no particular date, like the homepage
 * cards. Describes the offer instead of pricing a session that isn't chosen yet.
 */
export function describeUpcomingDiscount(cls: DiscountableClass): string | null {
  if (!cls.discount_percent || !cls.discount_starts_on) return null;

  const start = new Date(cls.discount_starts_on + "T00:00:00");
  const end = cls.discount_ends_on
    ? new Date(cls.discount_ends_on + "T00:00:00")
    : null;

  // A whole calendar month reads better as the month's name.
  const wholeMonth =
    end !== null &&
    start.getDate() === 1 &&
    end.getMonth() === start.getMonth() &&
    end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();

  if (wholeMonth) {
    return `${cls.discount_percent}% off in ${start.toLocaleDateString("en-GB", { month: "long" })}`;
  }

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return end
    ? `${cls.discount_percent}% off ${fmt(start)} to ${fmt(end)}`
    : `${cls.discount_percent}% off from ${fmt(start)}`;
}

/** "£10" for round pounds, "£11.60" otherwise. */
export function formatPrice(pence: number): string {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}

/** The columns every price lookup needs. Keeps the selects honest. */
export const PRICING_COLUMNS =
  "price_pence, discount_percent, discount_starts_on, discount_ends_on";
