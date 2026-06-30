/**
 * Single source of truth for each class type's visual accent.
 *
 * Keyed by class slug. New class types MUST be added here so their timetable
 * bar, card icon-area background and icon tint all stay in sync. These used to
 * live in three separate per-class maps (slot-card colorMap, class-card
 * gradientMap, and a flat cocoa tint on the icon), so a newly-added class fell
 * back to a generic gold bar / sand card and a colourless icon.
 *
 * All values are complete Tailwind class literals so the JIT compiler picks
 * them up from this file — never build them by string concatenation.
 */

export interface ClassTheme {
  /** bg-* for the timetable colour bar (slot-card). */
  bar: string
  /** text-* (+ group-hover) for the line-art icon tint (class-card). */
  icon: string
  /** gradient for the card icon-area background (class-card). */
  gradient: string
}

const FALLBACK: ClassTheme = {
  bar: "bg-gold",
  icon: "text-gold/80 group-hover:text-gold",
  gradient: "bg-gradient-to-br from-gold/[0.08] to-wheat/30",
}

const CLASS_THEME: Record<string, ClassTheme> = {
  "hot-pilates": {
    bar: "bg-ember",
    icon: "text-ember/70 group-hover:text-ember",
    gradient: "bg-gradient-to-br from-ember/[0.12] to-gold/[0.15]",
  },
  "hot-yoga": {
    bar: "bg-ember",
    icon: "text-ember/70 group-hover:text-ember",
    gradient: "bg-gradient-to-br from-wheat/30 to-ember/[0.08]",
  },
  "pilates-sculpt": {
    bar: "bg-gold",
    icon: "text-gold/80 group-hover:text-gold",
    gradient: "bg-gradient-to-br from-cocoa/[0.06] to-gold/[0.1]",
  },
  "cardio-pilates": {
    bar: "bg-blush",
    icon: "text-blush/80 group-hover:text-blush",
    gradient: "bg-gradient-to-br from-blush/[0.1] to-sand/30",
  },
  "beginners-pilates": {
    bar: "bg-sand",
    icon: "text-warm-grey/60 group-hover:text-warm-grey",
    gradient: "bg-gradient-to-br from-wheat/25 to-cream/50",
  },
  "infrared-sculpt-swt-pilates": {
    bar: "bg-ember",
    icon: "text-ember/70 group-hover:text-ember",
    gradient: "bg-gradient-to-br from-ember/[0.14] to-cocoa/[0.08]",
  },
  "mat-pilates-flow": {
    bar: "bg-gold",
    icon: "text-gold/80 group-hover:text-gold",
    gradient: "bg-gradient-to-br from-gold/[0.08] to-wheat/30",
  },
  // New class types
  barre: {
    bar: "bg-gold",
    icon: "text-gold/80 group-hover:text-gold",
    gradient: "bg-gradient-to-br from-gold/[0.1] to-cream/50",
  },
  "boxercise-girls-only": {
    bar: "bg-ember",
    icon: "text-ember/70 group-hover:text-ember",
    gradient: "bg-gradient-to-br from-ember/[0.12] to-blush/[0.1]",
  },
  "mindful-infrared-pilates-mixed-level": {
    bar: "bg-blush",
    icon: "text-blush/80 group-hover:text-blush",
    gradient: "bg-gradient-to-br from-blush/[0.1] to-wheat/25",
  },
}

export function classTheme(slug: string): ClassTheme {
  return CLASS_THEME[slug] ?? FALLBACK
}
