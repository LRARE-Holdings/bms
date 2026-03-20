export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { requireAuth, getStudioId } from "@/lib/auth";
import PackStatus from "@/components/account/pack-status";
import AccountHeader from "@/components/account/account-header";
import BuyPackButton from "@/components/account/buy-pack-button";
import type { Class } from "@/lib/types";

export const metadata = {
  title: "Class Packs | Burn Mat Studio",
};

export default async function PacksPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const studioId = getStudioId();

  const [{ data: packs }, { data: classes }] = await Promise.all([
    supabase
      .from("class_packs")
      .select("*")
      .eq("profile_id", user.id)
      .eq("studio_id", studioId)
      .gt("credits_remaining", 0)
      .gt("expires_at", new Date().toISOString())
      .order("purchased_at", { ascending: true }),
    supabase
      .from("classes")
      .select("*")
      .eq("studio_id", studioId)
      .order("price_pence", { ascending: false }),
  ]);

  return (
    <section className="py-10 px-5 md:px-10 max-w-[1100px]">
      <AccountHeader
        eyebrow="Class packs"
        title="Your packs"
        subtitle="Active packs and credits. Buy a pack to save on every class."
      />

      {/* Active packs */}
      <PackStatus packs={packs || []} />

      {/* Buy a pack — always visible */}
      <div className="mt-10">
        <h2 className="font-display text-[clamp(1.4rem,2.5vw,1.8rem)] font-semibold text-cocoa leading-tight mb-1">
          Buy a pack
        </h2>
        <p className="text-[0.84rem] text-warm-grey mb-5">
          Save up to 40% compared to drop-in prices.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 10 Class Pack */}
          <div className="bg-cocoa rounded-2xl p-6 text-center flex flex-col justify-center relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-ember text-white text-[0.6rem] font-semibold tracking-[0.1em] uppercase px-3 py-0.5 rounded-full">
              Best value
            </div>
            <h3 className="font-display text-xl font-semibold text-wheat mb-0.5">
              10 Class Pack
            </h3>
            <div className="font-display text-[2.2rem] font-light text-wheat my-1">
              &pound;75
            </div>
            <p className="text-[0.72rem] text-warm-grey mb-0.5">
              &pound;7.50 per class
            </p>
            <p className="text-[0.68rem] text-warm-grey">
              Use within 6 weeks
            </p>
            <BuyPackButton
              packType="10"
              className="block w-full mt-4 py-2.5 rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase text-center border-[1.5px] border-gold text-gold bg-transparent hover:bg-gold hover:text-cocoa transition-colors cursor-pointer"
            >
              Buy pack
            </BuyPackButton>
          </div>

          {/* 5 Class Pack */}
          <div className="bg-white border border-sand rounded-2xl p-6 text-center flex flex-col justify-center">
            <h3 className="font-display text-xl font-semibold text-cocoa mb-0.5">
              5 Class Pack
            </h3>
            <div className="font-display text-[2.2rem] font-light text-cocoa my-1">
              &pound;37.50
            </div>
            <p className="text-[0.72rem] text-warm-grey mb-0.5">
              &pound;7.50 per class
            </p>
            <p className="text-[0.68rem] text-warm-grey">
              Use within 4 weeks
            </p>
            <BuyPackButton
              packType="5"
              className="block w-full mt-4 py-2.5 rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase text-center border-[1.5px] border-cocoa text-cocoa bg-transparent hover:bg-cocoa hover:text-wheat transition-colors cursor-pointer"
            >
              Buy pack
            </BuyPackButton>
          </div>
        </div>

        {/* Drop-in pricing table */}
        <div className="mt-8">
          <h2 className="font-display text-[clamp(1.4rem,2.5vw,1.8rem)] font-semibold text-cocoa leading-tight mb-1">
            Drop-in prices
          </h2>
          <p className="text-[0.84rem] text-warm-grey mb-4">
            Pay per class without a pack.
          </p>
          <div className="bg-white border border-sand rounded-2xl overflow-hidden">
            {(classes as Class[])?.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between px-5 py-2.5 border-b border-sand last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[0.84rem] text-cocoa">
                    {cls.name}
                  </span>
                  <span className="text-[0.72rem] text-warm-grey">
                    {cls.duration_mins} min
                  </span>
                </div>
                <span className="font-semibold text-[0.84rem] text-cocoa">
                  &pound;{(cls.price_pence / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
