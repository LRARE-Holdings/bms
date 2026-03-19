/**
 * Minimal line-art SVG icons for each class type.
 * Drawn in brand warm-grey with a consistent 44px viewBox, 1.5px stroke.
 */

const iconProps = {
  width: 44,
  height: 44,
  viewBox: "0 0 44 44",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Hot Pilates — figure in a plank with heat lines rising */
function HotPilates() {
  return (
    <svg {...iconProps}>
      {/* Head */}
      <circle cx="10" cy="18" r="2.5" />
      {/* Plank body */}
      <path d="M12.5 18.5L26 15.5L34 21" />
      {/* Arms down */}
      <path d="M17 16L16 23" />
      {/* Legs */}
      <path d="M26 15.5L30 12" />
      <path d="M26 15.5L28 11" />
      {/* Heat waves */}
      <path d="M18 28c0.8-1.5 0-3 0.8-4.5" strokeWidth="1" opacity="0.5" />
      <path d="M22 27c0.8-1.5 0-3 0.8-4.5" strokeWidth="1" opacity="0.5" />
      <path d="M26 28c0.8-1.5 0-3 0.8-4.5" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/** Hot Yoga — figure in tree pose with heat lines */
function HotYoga() {
  return (
    <svg {...iconProps}>
      {/* Head */}
      <circle cx="22" cy="8" r="2.5" />
      {/* Body line */}
      <path d="M22 10.5V24" />
      {/* Arms — raised overhead forming a V */}
      <path d="M22 14L17 8" />
      <path d="M22 14L27 8" />
      {/* Standing leg */}
      <path d="M22 24L20 33" />
      {/* Tree pose leg — foot on inner thigh */}
      <path d="M22 24L27 20L25 24" />
      {/* Heat waves */}
      <path d="M12 32c0.8-1.5 0-3 0.8-4.5" strokeWidth="1" opacity="0.5" />
      <path d="M32 30c0.8-1.5 0-3 0.8-4.5" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/** Pilates Sculpt — figure with dumbbells in lunge */
function PilatesSculpt() {
  return (
    <svg {...iconProps}>
      {/* Head */}
      <circle cx="18" cy="8" r="2.5" />
      {/* Torso */}
      <path d="M18 10.5V20" />
      {/* Lunge legs */}
      <path d="M18 20L13 30" />
      <path d="M18 20L25 28" />
      {/* Arms with weights */}
      <path d="M18 14L12 11" />
      <path d="M18 14L24 11" />
      {/* Dumbbells */}
      <line x1="10.5" y1="10" x2="13.5" y2="12" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="22.5" y1="10" x2="25.5" y2="12" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Cardio Pilates — figure mid-jump with energy lines */
function CardioPilates() {
  return (
    <svg {...iconProps}>
      {/* Head */}
      <circle cx="22" cy="7" r="2.5" />
      {/* Torso */}
      <path d="M22 9.5V18" />
      {/* Arms — dynamic outward */}
      <path d="M22 13L16 9" />
      <path d="M22 13L28 9" />
      {/* Legs — split in air */}
      <path d="M22 18L17 26" />
      <path d="M22 18L27 26" />
      {/* Ground gap — in the air */}
      {/* Energy lines */}
      <path d="M11 16L9 16" strokeWidth="1.2" opacity="0.4" />
      <path d="M11 19L8 20" strokeWidth="1.2" opacity="0.4" />
      <path d="M33 16L35 16" strokeWidth="1.2" opacity="0.4" />
      <path d="M33 19L36 20" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}

/** Beginners Pilates — figure seated on mat, gentle pose */
function BeginnersPilates() {
  return (
    <svg {...iconProps}>
      {/* Head */}
      <circle cx="20" cy="10" r="2.5" />
      {/* Seated torso — slight lean */}
      <path d="M20 12.5V22" />
      {/* Legs — seated forward fold */}
      <path d="M20 22L14 28" />
      <path d="M20 22L28 28" />
      {/* Arms resting forward */}
      <path d="M20 16L15 20" />
      <path d="M20 16L25 20" />
      {/* Mat */}
      <path d="M10 30L34 30" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

/** Baby & Me Yoga — parent with small child, gentle */
function BabyMeYoga() {
  return (
    <svg {...iconProps}>
      {/* Parent head */}
      <circle cx="17" cy="8" r="2.5" />
      {/* Parent body */}
      <path d="M17 10.5V22" />
      {/* Parent legs — cross-legged */}
      <path d="M17 22C14 24 12 26 15 27" />
      <path d="M17 22C20 24 22 26 19 27" />
      {/* Parent arms — cradling */}
      <path d="M17 15C21 14 24 16 24 19" />
      <path d="M17 17L21 19" />
      {/* Baby — small circle */}
      <circle cx="24" cy="17" r="2" strokeWidth="1.2" />
      {/* Small heart */}
      <path d="M28 11C28.5 10 30 10 30 11.5C30 13 28 14 28 14C28 14 26 13 26 11.5C26 10 27.5 10 28 11Z" strokeWidth="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

const CLASS_ICONS: Record<string, React.FC> = {
  "hot-pilates": HotPilates,
  "hot-yoga": HotYoga,
  "pilates-sculpt": PilatesSculpt,
  "cardio-pilates": CardioPilates,
  "beginners-pilates": BeginnersPilates,
  "baby-me-yoga": BabyMeYoga,
};

export default function ClassIcon({ slug }: { slug: string }) {
  const Icon = CLASS_ICONS[slug];
  if (!Icon) return null;
  return <Icon />;
}
