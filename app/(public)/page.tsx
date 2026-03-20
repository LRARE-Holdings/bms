export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getStudioId } from "@/lib/auth";
import ClassCard from "@/components/classes/class-card";
import InstructorCard from "@/components/team/instructor-card";
import TimetableView from "@/components/timetable/timetable-view";
import HeroCanvas from "@/components/hero/hero-canvas";
import type { Class, Instructor, PackTier, MembershipTier } from "@/lib/types";

const classTagsMap: Record<string, string[]> = {
  lucy: ["Hot Pilates", "Hot Yoga", "Beginners"],
  amelia: ["Pilates Sculpt", "Cardio Pilates"],
  takkiya: ["Baby & Me Yoga", "Beginners Pilates"],
};

export default async function HomePage() {
  const supabase = await createClient();
  const studioId = await getStudioId();

  const [{ data: classes }, { data: instructors }, { data: packTiers }, { data: membershipTiers }] =
    await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .eq("studio_id", studioId)
        .order("price_pence", { ascending: false }),
      supabase
        .from("instructors")
        .select("*")
        .eq("studio_id", studioId)
        .order("created_at"),
      supabase
        .from("pack_tiers")
        .select("*")
        .eq("studio_id", studioId)
        .eq("is_active", true)
        .order("price_pence", { ascending: false }),
      supabase
        .from("membership_tiers")
        .select("*")
        .eq("studio_id", studioId)
        .eq("is_active", true)
        .order("price_pence", { ascending: true }),
    ]);

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="min-h-screen relative flex flex-col items-center justify-center bg-cocoa overflow-hidden">
        {/* Animated flowing gradients */}
        <div className="absolute inset-0">
          <HeroCanvas />
        </div>

        {/* Radial glow behind wordmark — pulsing */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] pointer-events-none animate-hero-glow"
          style={{
            background:
              "radial-gradient(ellipse 45% 40% at 50% 50%, rgba(196,169,90,0.15) 0%, rgba(212,113,58,0.06) 40%, transparent 70%)",
          }}
        />

        {/* Content — centred, staggered cinematic entrance */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 w-full">
          {/* "Feel the" */}
          <span
            className="block font-display text-[clamp(1.2rem,3vw,2rem)] font-light text-wheat/60 tracking-[0.15em] uppercase mb-4 md:mb-5 opacity-0 animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            Feel the
          </span>

          {/* BURN wordmark — massive, commanding */}
          <div
            className="relative opacity-0 animate-scale-in"
            style={{ animationDelay: "0.5s" }}
          >
            {/* Glow halo behind wordmark */}
            <div
              className="absolute inset-0 -inset-x-20 -inset-y-10 pointer-events-none blur-3xl opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(196,169,90,0.6) 0%, rgba(212,113,58,0.2) 50%, transparent 80%)",
              }}
            />
            <Image
              src="/Burn_Beige.svg"
              alt="BURN"
              width={1200}
              height={280}
              className="relative w-[clamp(320px,80vw,900px)] h-auto"
              priority
            />
          </div>

          {/* Gold divider line */}
          <div
            className="w-20 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent mt-10 mb-7 opacity-0 animate-line-grow origin-center"
            style={{ animationDelay: "1.1s" }}
          />

          {/* Tagline */}
          <span
            className="text-[0.72rem] md:text-[0.82rem] font-medium tracking-[0.3em] uppercase text-wheat/60 opacity-0 animate-fade-up"
            style={{ animationDelay: "1.2s" }}
          >
            Pilates &middot; Yoga &middot; Heat &middot; Sculpt
          </span>

          {/* CTA */}
          <a
            href="#timetable"
            className="group inline-flex items-center gap-2.5 mt-10 px-12 py-4 bg-gold text-cocoa text-[0.78rem] font-semibold tracking-[0.08em] uppercase rounded-full transition-all duration-500 hover:bg-wheat hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(196,169,90,0.4)] opacity-0 animate-fade-up"
            style={{ animationDelay: "1.4s" }}
          >
            View timetable
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            >
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-0 animate-fade-up"
          style={{ animationDelay: "2s" }}
        >
          <span className="text-[0.65rem] font-medium tracking-[0.3em] uppercase text-wheat/50">
            Scroll
          </span>
          <div className="w-5 h-9 rounded-full border-[1.5px] border-wheat/30 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-gold animate-scroll-dot" />
          </div>
        </div>
      </section>

      {/* ═══ ABOUT ═══ */}
      <section id="about" className="grid grid-cols-1 md:grid-cols-2 min-h-[480px]">
        <div className="bg-sand relative min-h-[300px] md:min-h-[400px]">
          <Image
            src="/studio.png"
            alt="Inside Burn Mat Studio"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
        <div className="flex flex-col justify-center p-8 md:p-12 bg-white">
          <p className="text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-gold mb-2">
            Our Studio
          </p>
          <h2 className="font-display text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-cocoa leading-tight mb-4">
            Built for the mat.
          </h2>
          <p className="text-[0.92rem] text-warm-grey leading-relaxed mb-2">
            Burn Mat Studio is a boutique Pilates and yoga studio in
            Stockton-on-Tees, founded by Lucy Healy.
          </p>
          <p className="text-[0.92rem] text-warm-grey leading-relaxed mb-4">
            Whether you&apos;re brand new to movement or a seasoned
            practitioner, our classes are designed to challenge you at your own
            level. No mirrors, no judgement &mdash; just good work on the mat.
          </p>
          <div className="flex gap-10 pt-5 border-t border-sand mt-2">
            <div>
              <strong className="font-display text-3xl font-normal text-cocoa block">6</strong>
              <span className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-warm-grey">Class types</span>
            </div>
            <div>
              <strong className="font-display text-3xl font-normal text-cocoa block">10</strong>
              <span className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-warm-grey">Max per class</span>
            </div>
            <div>
              <strong className="font-display text-3xl font-normal text-cocoa block">3</strong>
              <span className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-warm-grey">Instructors</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CLASSES ═══ */}
      <section id="classes" className="py-20 px-5 md:px-8 max-w-[1100px] mx-auto">
        <p className="text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-gold mb-2">
          What we offer
        </p>
        <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-normal text-cocoa leading-tight mb-3">
          Our classes
        </h2>
        <p className="text-[0.92rem] text-warm-grey leading-relaxed max-w-lg mb-10">
          From heated mat work to gentle flows, every class is designed for
          small groups of 10 or fewer.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(classes as Class[])?.map((cls) => (
            <ClassCard key={cls.id} cls={cls} />
          ))}
        </div>
      </section>

      {/* ═══ TEAM ═══ */}
      <section id="team" className="py-20 px-5 md:px-8 max-w-[1100px] mx-auto">
        <p className="text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-gold mb-2">
          The team
        </p>
        <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-normal text-cocoa leading-tight mb-3">
          Meet your instructors
        </h2>
        <p className="text-[0.92rem] text-warm-grey leading-relaxed max-w-lg mb-10">
          Every class is led by a qualified, passionate instructor who knows your name.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(instructors as Instructor[])?.map((instructor) => (
            <InstructorCard
              key={instructor.id}
              instructor={instructor}
              classTags={classTagsMap[instructor.slug]}
            />
          ))}
        </div>
      </section>

      {/* ═══ TIMETABLE ═══ */}
      <section id="timetable" className="py-20 px-5 md:px-8 max-w-[1100px] mx-auto">
        <div className="mb-10">
          <p className="text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-gold mb-2">
            Book a class
          </p>
          <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-normal text-cocoa leading-tight mb-3">
            Class timetable
          </h2>
          <p className="text-[0.92rem] text-warm-grey leading-relaxed max-w-lg">
            Browse the weekly schedule and book your spot. All classes are capped
            at 10 for a personal experience.
          </p>
        </div>
        <TimetableView studioId={studioId} />
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-20 px-5 md:px-8 max-w-[1100px] mx-auto">
        <p className="text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-gold mb-2">
          Pricing
        </p>
        <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-normal text-cocoa leading-tight mb-3">
          Simple, transparent pricing
        </h2>
        <p className="text-[0.92rem] text-warm-grey leading-relaxed max-w-lg mb-10">
          Pay per class, save with a pack{(membershipTiers as MembershipTier[])?.length > 0 ? ", or subscribe for unlimited access" : ""}. No lock-in.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
          {/* Pricing table */}
          <div className="bg-white border border-sand rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 bg-cream text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-warm-grey">
              <span>Class</span>
              <span>Duration</span>
              <span>Price</span>
            </div>
            {(classes as Class[])?.map((cls) => (
              <div
                key={cls.id}
                className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 border-b border-sand last:border-b-0 items-center"
              >
                <span className="font-semibold text-[0.88rem] text-cocoa">
                  {cls.name}
                </span>
                <span className="text-[0.78rem] text-warm-grey">
                  {cls.duration_mins} min
                </span>
                <span className="font-semibold text-[0.88rem] text-cocoa text-right">
                  &pound;{(cls.price_pence / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Pack & membership cards */}
          <div className="flex flex-col gap-4">
            {(packTiers as PackTier[])?.map((tier, i) => {
              const perClass = (tier.price_pence / tier.credits / 100).toFixed(2);
              const validityLabel =
                tier.validity_days % 7 === 0
                  ? `${tier.validity_days / 7} weeks`
                  : `${tier.validity_days} days`;
              const isFirst = i === 0;

              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl p-6 text-center flex-1 flex flex-col justify-center relative ${
                    isFirst
                      ? "bg-cocoa"
                      : "bg-white border border-sand"
                  }`}
                >
                  {isFirst && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-ember text-white text-[0.6rem] font-semibold tracking-[0.1em] uppercase px-3 py-0.5 rounded-full">
                      Best value
                    </div>
                  )}
                  <h4
                    className={`font-display text-xl font-semibold mb-0.5 ${
                      isFirst ? "text-wheat" : "text-cocoa"
                    }`}
                  >
                    {tier.name}
                  </h4>
                  <div
                    className={`font-display text-[2.2rem] font-light my-1 ${
                      isFirst ? "text-wheat" : "text-cocoa"
                    }`}
                  >
                    &pound;{(tier.price_pence / 100).toFixed(2)}
                  </div>
                  <p className="text-[0.72rem] text-warm-grey mb-0.5">
                    &pound;{perClass} per class
                  </p>
                  <p className="text-[0.68rem] text-warm-grey">
                    Use within {validityLabel}
                  </p>
                  <Link
                    href="/signup"
                    className={`block mt-4 py-2.5 rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase text-center border-[1.5px] transition-colors ${
                      isFirst
                        ? "border-gold text-gold bg-transparent hover:bg-gold hover:text-cocoa"
                        : "border-cocoa text-cocoa bg-transparent hover:bg-cocoa hover:text-wheat"
                    }`}
                  >
                    Buy pack
                  </Link>
                </div>
              );
            })}

            {(membershipTiers as MembershipTier[])?.map((tier) => {
              const intervalLabel =
                tier.interval_count > 1
                  ? `every ${tier.interval_count} ${tier.interval}s`
                  : `per ${tier.interval}`;

              return (
                <div
                  key={tier.id}
                  className="bg-gold/10 border border-gold/30 rounded-2xl p-6 text-center flex-1 flex flex-col justify-center"
                >
                  <h4 className="font-display text-xl font-semibold text-cocoa mb-0.5">
                    {tier.name}
                  </h4>
                  {tier.description && (
                    <p className="text-[0.72rem] text-warm-grey mb-1">
                      {tier.description}
                    </p>
                  )}
                  <div className="font-display text-[2.2rem] font-light text-cocoa my-1">
                    &pound;{(tier.price_pence / 100).toFixed(2)}
                  </div>
                  <p className="text-[0.72rem] text-warm-grey">
                    {intervalLabel}
                  </p>
                  <Link
                    href="/signup"
                    className="block mt-4 py-2.5 rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase text-center bg-cocoa text-wheat hover:bg-gold hover:text-cocoa transition-colors"
                  >
                    Subscribe
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section className="bg-cocoa py-16 px-8 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 20% 80%, rgba(196,169,90,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(223,208,165,0.06) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10">
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-normal text-wheat mb-2">
            Your first class is <em className="italic text-gold">on us.</em>
          </h2>
          <p className="text-[0.82rem] text-warm-grey mb-6">
            Try any class free. No card required. Just book and show up.
          </p>
          <a
            href="#timetable"
            className="inline-flex items-center gap-2.5 px-9 py-3.5 bg-gold text-cocoa text-[0.78rem] font-semibold tracking-[0.08em] uppercase rounded-full transition-all duration-300 hover:bg-wheat hover:-translate-y-0.5"
          >
            Book your free class
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
        </div>
      </section>
    </>
  );
}
