import Image from "next/image";
import type { Instructor } from "@/lib/types";
import { getInstructorPhotoUrl } from "@/lib/supabase/storage";

export default function InstructorCard({
  instructor,
  classTags,
}: {
  instructor: Instructor;
  classTags?: string[];
}) {
  const photoUrl = getInstructorPhotoUrl(instructor.photo_url);
  const initials = instructor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white border border-sand rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_12px_40px_rgba(71,55,40,0.08)] hover:border-gold text-center">
      {/* Photo or placeholder */}
      <div className="relative h-52 bg-sand overflow-hidden">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={instructor.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cocoa to-cocoa/80 flex items-center justify-center">
            <span className="font-display text-4xl font-light text-wheat/70 tracking-wide">
              {initials}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-display text-[1.4rem] font-semibold text-cocoa mb-0.5">
          {instructor.name}
        </h3>
        <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-gold mb-2.5">
          {instructor.slug === "lucy" ? "Founder & Lead Instructor" : "Instructor"}
        </p>
        <p className="text-[0.82rem] text-warm-grey leading-relaxed mb-3">
          {instructor.bio}
        </p>
        {classTags && classTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap justify-center">
            {classTags.map((tag) => (
              <span
                key={tag}
                className="text-[0.62rem] font-semibold tracking-[0.05em] uppercase px-2.5 py-0.5 rounded-full bg-cream text-warm-grey"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
