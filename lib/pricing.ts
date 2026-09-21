/**
 * What a drop-in class costs today.
 *
 * `price_pence` is always the list price. A discount is a dated overlay on top
 * of it, set in forma-admin, so a promotion lapses on its own date and the
 * original price is still there afterwards.
 *
 * These rules match the `classes_with_pricing` view and forma-admin's
 * `lib/pricing.ts`. All three have to agree, or this site will show one price
 * and charge another.
 */

export interface DiscountableClass {
  price_pence: number;
  discount_percent?: number | null;
  discount_starts_on?: string | null;
  discount_ends_on?: string | null;
}

/** Today in UK local time, as YYYY-MM-DD. Vercel runs in UTC. */
function todayUK(): string {
  const parts = new Date()
    .toLocaleDateString("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split("/");
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

export function isDiscountActive(
  cls: DiscountableClass,
  today: string = todayUK()
): boolean {
  if (!cls.discount_percent) return false;
  if (cls.discount_starts_on && cls.discount_starts_on > today) return false;
  if (cls.discount_ends_on && cls.discount_ends_on < today) return false;
  return true;
}

/** The amount to actually charge. */
export function effectivePricePence(
  cls: DiscountableClass,
  today: string = todayUK()
): number {
  if (!isDiscountActive(cls, today)) return cls.price_pence;
  return Math.round((cls.price_pence * (100 - cls.discount_percent!)) / 100);
}

/** "£10" for round pounds, "£11.60" otherwise. */
export function formatPrice(pence: number): string {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}

/** The columns every price lookup needs. Keeps the selects honest. */
export const PRICING_COLUMNS =
  "price_pence, discount_percent, discount_starts_on, discount_ends_on";
