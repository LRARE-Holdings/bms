export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { requireAuth, getStudioId } from "@/lib/auth";
import AccountHeader from "@/components/account/account-header";
import MembershipStatus from "@/components/account/membership-status";
import SubscribeButton from "@/components/checkout/subscribe-button";
import type { MembershipTier } from "@/lib/types";

export const metadata = {
  title: "Membership | Burn Mat Studio",
};

export default async function MembershipPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const studioId = await getStudioId();

  const [{ data: memberships }, { data: membershipTiers }] = await Promise.all([
    supabase
      .from("memberships")
      .select("*, membership_tiers(name, description, price_pence, interval, interval_count)")
      .eq("profile_id", user.id)
      .eq("studio_id", studioId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("membership_tiers")
      .select("*")
      .eq("studio_id", studioId)
      .eq("is_active", true)
      .order("price_pence", { ascending: true }),
  ]);

  const activeMembership = memberships?.find((m) => m.status === "active");
  const tiers = (membershipTiers || []) as MembershipTier[];

  return (
    <section className="py-10 px-5 md:px-10 max-w-[1100px]">
      <AccountHeader
        eyebrow="Membership"
        title="Your membership"
        subtitle="Manage your membership or subscribe to book classes at no extra cost."
      />

      {/* Current membership */}
      {activeMembership ? (
        <MembershipStatus membership={activeMembership} />
      ) : (
        <div className="bg-white border border-sand rounded-2xl p-8 text-center mb-8">
          <p className="text-[0.88rem] text-warm-grey">
            No active membership.
          </p>
        </div>
      )}

      {/* Available tiers — show if no active membership */}
      {!activeMembership && tiers.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-[clamp(1.4rem,2.5vw,1.8rem)] font-semibold text-cocoa leading-tight mb-1">
            Membership plans
          </h2>
          <p className="text-[0.84rem] text-warm-grey mb-5">
            Subscribe and book unlimited classes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tiers.map((tier) => {
              const intervalLabel =
                tier.interval_count > 1
                  ? `every ${tier.interval_count} ${tier.interval}s`
                  : `per ${tier.interval}`;

              return (
                <div
                  key={tier.id}
                  className="bg-white border border-sand rounded-2xl p-6 text-center flex flex-col justify-center"
                >
                  <h3 className="font-display text-xl font-semibold text-cocoa mb-1">
                    {tier.name}
                  </h3>
                  {tier.description && (
                    <p className="text-[0.78rem] text-warm-grey mb-2">
                      {tier.description}
                    </p>
                  )}
                  <div className="font-display text-[2.2rem] font-light text-cocoa my-1">
                    &pound;{(tier.price_pence / 100).toFixed(2)}
                  </div>
                  <p className="text-[0.72rem] text-warm-grey mb-4">
                    {intervalLabel}
                  </p>
                  <SubscribeButton
                    tierId={tier.id}
                    profileId={user.id}
                    className="block w-full py-2.5 rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase text-center bg-cocoa text-wheat hover:bg-gold hover:text-cocoa transition-colors"
                  >
                    Subscribe
                  </SubscribeButton>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
