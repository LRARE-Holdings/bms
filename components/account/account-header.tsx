interface AccountHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
}

export default function AccountHeader({ eyebrow, title, subtitle }: AccountHeaderProps) {
  return (
    <div className="mb-8">
      <p className="text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-gold mb-2">
        {eyebrow}
      </p>
      <h1 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold text-cocoa leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-[0.88rem] text-warm-grey leading-relaxed max-w-lg mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}
