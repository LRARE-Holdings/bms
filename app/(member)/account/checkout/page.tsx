export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  createDropinPaymentIntent,
  createPackPaymentIntent,
  createMembershipSubscription,
} from "@/lib/checkout";
import StripeProvider from "@/components/checkout/stripe-provider";
import CheckoutForm from "@/components/checkout/checkout-form";
import Link from "next/link";
import type { CheckoutType } from "@/lib/types";
import { getStudioId } from "@/lib/studio-context";

export const metadata = {
  title: "Checkout | Burn Mat Studio",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireAuth();
  const studioId = await getStudioId();
  const params = await searchParams;

  const type = params.type as CheckoutType | undefined;
  const scheduleId = params.schedule_id;
  const date = params.date;
  const tierId = params.tier_id;

  if (!type) {
    redirect("/account");
  }

  let clientSecret: string;
  let stripeAccountId: string | null = null;
  let displayData: { name: string; pricePounds: string; description: string };

  try {
    if (type === "dropin") {
      if (!scheduleId || !date) redirect("/account");
      const result = await createDropinPaymentIntent(
        user.id,
        scheduleId,
        date,
        studioId
      );
      clientSecret = result.clientSecret;
      stripeAccountId = result.stripeAccountId;
      displayData = result.displayData;
    } else if (type === "pack") {
      if (!tierId) redirect("/account/packs");
      const result = await createPackPaymentIntent(user.id, tierId, studioId);
      clientSecret = result.clientSecret;
      stripeAccountId = result.stripeAccountId;
      displayData = result.displayData;
    } else if (type === "membership") {
      if (!tierId) redirect("/account/membership");
      const result = await createMembershipSubscription(
        user.id,
        tierId,
        studioId
      );
      clientSecret = result.clientSecret;
      stripeAccountId = result.stripeAccountId;
      displayData = result.displayData;
    } else {
      redirect("/account");
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong";
    return (
      <section className="py-10 px-5 md:px-10 max-w-[520px]">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-[0.78rem] text-warm-grey hover:text-cocoa transition-colors mb-6"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="bg-white border border-sand rounded-2xl p-8 text-center">
          <p className="text-[0.88rem] text-ember mb-3">{message}</p>
          <Link
            href="/account"
            className="inline-block px-6 py-2 bg-gold text-cocoa rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
          >
            Go back
          </Link>
        </div>
      </section>
    );
  }

  const backHref =
    type === "dropin"
      ? "/account"
      : type === "pack"
        ? "/account/packs"
        : "/account/membership";

  return (
    <section className="py-10 px-5 md:px-10 max-w-[520px]">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-[0.78rem] text-warm-grey hover:text-cocoa transition-colors mb-6"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <h1 className="font-display text-[clamp(1.6rem,3vw,2rem)] font-semibold text-cocoa leading-tight mb-6">
        Checkout
      </h1>

      <StripeProvider
        clientSecret={clientSecret}
        stripeAccountId={stripeAccountId}
      >
        <CheckoutForm
          type={type}
          displayData={displayData}
          profileId={user.id}
          scheduleId={scheduleId}
          date={date}
          tierId={tierId}
        />
      </StripeProvider>
    </section>
  );
}
