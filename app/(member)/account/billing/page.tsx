export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import AccountHeader from "@/components/account/account-header";
import BillingPortalButton from "@/components/account/billing-portal-button";

export const metadata = {
  title: "Billing | Burn Mat Studio",
};

export default async function BillingPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const hasStripeCustomer = !!profile?.stripe_customer_id;

  return (
    <section className="py-10 px-5 md:px-10 max-w-2xl">
      <AccountHeader
        eyebrow="Billing"
        title="Payment & receipts"
        subtitle="Manage your payment methods and view past receipts through our secure billing portal."
      />

      {hasStripeCustomer ? (
        <div className="bg-white border border-sand rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[0.92rem] text-cocoa mb-1">
                Stripe Customer Portal
              </h3>
              <p className="text-[0.82rem] text-warm-grey leading-relaxed mb-4">
                View your payment history, download receipts, and update your payment methods.
              </p>
              <BillingPortalButton />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-sand rounded-2xl p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-cream flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-warm-grey">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-semibold text-cocoa mb-2">
            No billing history yet
          </h3>
          <p className="text-[0.84rem] text-warm-grey leading-relaxed max-w-sm mx-auto">
            Your billing details will appear here after your first purchase.
            Book a class or buy a class pack to get started.
          </p>
        </div>
      )}
    </section>
  );
}
