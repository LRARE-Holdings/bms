export const dynamic = "force-dynamic";

import { requireRole, getStudioId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import SettingsToggle from "./settings-toggle";

export const metadata = {
  title: "Studio Settings | Burn Mat Studio",
};

export default async function SettingsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const studioId = await getStudioId();

  const { data: studio } = await supabase
    .from("studios")
    .select("first_class_free_enabled")
    .eq("id", studioId)
    .single();

  return (
    <section className="py-10 px-5 md:px-10 max-w-[800px]">
      <p className="text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-gold mb-2">
        Admin
      </p>
      <h1 className="font-display text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-cocoa leading-tight mb-1">
        Studio settings
      </h1>
      <p className="text-[0.82rem] text-warm-grey mb-8">
        Manage promotional offers and studio configuration.
      </p>

      <div className="bg-white border border-sand rounded-2xl divide-y divide-sand">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-[0.92rem] font-semibold text-cocoa mb-1">
                First class free
              </h3>
              <p className="text-[0.78rem] text-warm-grey leading-relaxed max-w-sm">
                When enabled, new members can book their first class for free.
                A banner will appear on the homepage and signup page. Each
                member can only claim this once.
              </p>
            </div>
            <SettingsToggle
              initialValue={studio?.first_class_free_enabled ?? false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
