import type { Class } from "@/lib/types";
import ClassIcon from "./class-icons";
import { classTheme } from "@/lib/class-theme";

export default function ClassCard({ cls }: { cls: Class }) {
  const { gradient, icon } = classTheme(cls.slug);
  const priceDisplay =
    cls.price_pence % 100 === 0
      ? `£${cls.price_pence / 100}`
      : `£${(cls.price_pence / 100).toFixed(2)}`;

  return (
    <a href="#timetable" className="group h-full">
      <div className="h-full flex flex-col bg-white border border-sand rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_14px_44px_rgba(71,55,40,0.09)] group-hover:border-gold">
        {/* Icon area */}
        <div className={`h-36 shrink-0 flex items-center justify-center relative ${gradient}`}>
          <div className={`${icon} transition-colors duration-300 scale-[2]`}>
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
