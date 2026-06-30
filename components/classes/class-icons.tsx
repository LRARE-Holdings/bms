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

/** Infrared Sculpt SWT Pilates — figure in wide squat with weights, infrared waves */
function InfraredSculptSwt() {
  return (
    <svg {...iconProps}>
      {/* Head */}
      <circle cx="22" cy="7" r="2.5" />
      {/* Torso — slight forward lean */}
      <path d="M22 9.5V19" />
      {/* Wide squat legs */}
      <path d="M22 19L15 27" />
      <path d="M22 19L29 27" />
      {/* Arms raised with weights — victory press */}
      <path d="M22 13L16 8" />
      <path d="M22 13L28 8" />
      {/* Dumbbells */}
      <line x1="14.5" y1="7" x2="17.5" y2="9" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26.5" y1="7" x2="29.5" y2="9" strokeWidth="2.5" strokeLinecap="round" />
      {/* Infrared waves — curved arcs radiating outward */}
      <path d="M8 18c0-2.5 1.2-4.5 3-6" strokeWidth="1" opacity="0.35" />
      <path d="M5 19c0-3.5 1.8-6.5 4.5-8.5" strokeWidth="1" opacity="0.2" />
      <path d="M36 18c0-2.5-1.2-4.5-3-6" strokeWidth="1" opacity="0.35" />
      <path d="M39 19c0-3.5-1.8-6.5-4.5-8.5" strokeWidth="1" opacity="0.2" />
      {/* Sweat drops */}
      <path d="M13 14l-0.5 2" strokeWidth="1" opacity="0.4" />
      <path d="M31 14l0.5 2" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

/** Mat Pilates Flow — figure in a flowing roll-up on mat */
function MatPilatesFlow() {
  return (
    <svg {...iconProps}>
      {/* Head */}
      <circle cx="24" cy="10" r="2.5" />
      {/* Torso — mid roll-up, curved spine */}
      <path d="M24 12.5C23 15 21 17 19 19" />
      {/* Lower body — extended on mat */}
      <path d="M19 19C17 21 14 24 12 26" />
      {/* Upper leg on mat */}
      <path d="M19 19L16 25" />
      {/* Arms — reaching forward gracefully */}
      <path d="M23 14L29 11" />
      <path d="M22 16L28 14" />
      {/* Flow lines — smooth arcs suggesting movement */}
      <path d="M30 17C32 16 33 14 33 12" strokeWidth="1" opacity="0.3" />
      <path d="M31 20C34 18 35 15 35 12" strokeWidth="1" opacity="0.2" />
      {/* Mat */}
      <path d="M8 28L36 28" strokeWidth="1" opacity="0.4" />
      {/* Mat thickness hint */}
      <path d="M8 28.5L36 28.5" strokeWidth="0.5" opacity="0.2" />
    </svg>
  );
}

/** Barre — arabesque at the ballet barre */
function Barre() {
  return (
    <svg {...iconProps}>
      {/* Head */}
      <circle cx="14" cy="10" r="2.5" />
      {/* Torso — slight forward lean */}
      <path d="M14 12.5L17 21" />
      {/* Supporting leg with pointed toe */}
      <path d="M17 21L16 32" />
      <path d="M16 32L13.5 33" />
      {/* Lifted leg — arabesque extended behind */}
      <path d="M17 21L31 16.5" />
      <path d="M31 16.5L33.5 15.5" />
      {/* Front arm reaching to the barre */}
      <path d="M16 15L25 13" />
      {/* Back arm for balance */}
      <path d="M16 15L10.5 18" />
      {/* Ballet barre with mounting brackets */}
      <path d="M25 13L40 13" strokeWidth="1.2" />
      <path d="M28 13L28 16" strokeWidth="1" opacity="0.4" />
      <path d="M37 13L37 16" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

/** Boxercise — boxing stance throwing a jab, gloves as fists */
function Boxercise() {
  return (
    <svg {...iconProps}>
      {/* Head */}
      <circle cx="15" cy="9" r="2.5" />
      {/* Torso */}
      <path d="M15 11.5L17 21" />
      {/* Boxing stance — staggered legs */}
      <path d="M17 21L12 31" />
      <path d="M17 21L23 30" />
      {/* Guard arm — bent, fist up by the chin */}
      <path d="M16 14L20 13.5L19.5 10.5" />
      {/* Jab arm — extended forward */}
      <path d="M16 15.5L26.5 16.5" />
      {/* Gloves (fists) */}
      <line x1="18.5" y1="10" x2="20.5" y2="11" strokeWidth="3" strokeLinecap="round" />
      <line x1="25.5" y1="16" x2="28.5" y2="17" strokeWidth="3" strokeLinecap="round" />
      {/* Punch motion lines */}
      <path d="M31 16.5L34 16.5" strokeWidth="1.2" opacity="0.4" />
      <path d="M31 19L33.5 20" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}

/** Mindful Infrared Pilates — seated meditation with infrared waves */
function MindfulInfraredPilates() {
  return (
    <svg {...iconProps}>
      {/* Head */}
      <circle cx="22" cy="12" r="2.5" />
      {/* Upright torso */}
      <path d="M22 14.5V24" />
      {/* Crossed legs — seated base */}
      <path d="M22 24L13 30" />
      <path d="M22 24L31 30" />
      <path d="M13 30L31 30" />
      {/* Arms resting on knees */}
      <path d="M22 17L15.5 28" />
      <path d="M22 17L28.5 28" />
      {/* Infrared waves radiating outward */}
      <path d="M9 18c0-2.5 1.2-4.5 3-6" strokeWidth="1" opacity="0.35" />
      <path d="M6 19c0-3.5 1.8-6.5 4.5-8.5" strokeWidth="1" opacity="0.2" />
      <path d="M35 18c0-2.5-1.2-4.5-3-6" strokeWidth="1" opacity="0.35" />
      <path d="M38 19c0-3.5-1.8-6.5-4.5-8.5" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}

const CLASS_ICONS: Record<string, React.FC> = {
  "hot-pilates": HotPilates,
  "hot-yoga": HotYoga,
  "pilates-sculpt": PilatesSculpt,
  "cardio-pilates": CardioPilates,
  "beginners-pilates": BeginnersPilates,
  "infrared-sculpt-swt-pilates": InfraredSculptSwt,
  "mat-pilates-flow": MatPilatesFlow,
  barre: Barre,
  "boxercise-girls-only": Boxercise,
  "mindful-infrared-pilates-mixed-level": MindfulInfraredPilates,
};

export default function ClassIcon({ slug }: { slug: string }) {
  const Icon = CLASS_ICONS[slug];
  if (!Icon) return null;
  return <Icon />;
}
