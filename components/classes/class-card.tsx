import type { Class } from "@/lib/types";
import ClassIcon from "./class-icons";

const gradientMap: Record<string, string> = {
  "hot-pilates":
    "bg-gradient-to-br from-ember/[0.12] to-gold/[0.15]",
  "hot-yoga":
    "bg-gradient-to-br from-wheat/30 to-ember/[0.08]",
  "pilates-sculpt":
    "bg-gradient-to-br from-cocoa/[0.06] to-gold/[0.1]",
  "cardio-pilates":
    "bg-gradient-to-br from-blush/[0.1] to-sand/30",
  "beginners-pilates":
    "bg-gradient-to-br from-wheat/25 to-cream/50",
  "infrared-sculpt-swt-pilates":
    "bg-gradient-to-br from-ember/[0.14] to-cocoa/[0.08]",
  "mat-pilates-flow":
    "bg-gradient-to-br from-gold/[0.08] to-wheat/30",
};

export default function ClassCard({ cls }: { cls: Class }) {
  const gradient = gradientMap[cls.slug] ?? "bg-sand/20";
  const priceDisplay =
    cls.price_pence % 100 === 0
      ? `£${cls.price_pence / 100}`
      : `£${(cls.price_pence / 100).toFixed(2)}`;

  return (
    <a href="#timetable" className="group h-full">
      <div className="h-full flex flex-col bg-white border border-sand rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_14px_44px_rgba(71,55,40,0.09)] group-hover:border-gold">
        {/* Icon area */}
        <div className={`h-36 shrink-0 flex items-center justify-center relative ${gradient}`}>
          <div className="text-cocoa/40 group-hover:text-cocoa/60 transition-colors duration-300 scale-[2]">
            <ClassIcon slug={cls.slug} />
          </div>
          <span className="absolute top-3 right-3 bg-cocoa text-wheat text-[0.7rem] font-semibold px-2.5 py-0.5 rounded-full z-10">
            {priceDisplay}
          </span>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-display text-xl font-semibold text-cocoa mb-0.5">
            {cls.name}
          </h3>
          <p className="text-[0.68rem] font-semibold tracking-[0.08em] uppercase text-gold mb-1.5">
            {cls.duration_mins} minutes
          </p>
          <p className="text-[0.8rem] text-warm-grey leading-relaxed line-clamp-3">
            {cls.description}
          </p>
        </div>
      </div>
    </a>
  );
}
