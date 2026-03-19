export default function PageHeader({
  label,
  title,
  description,
}: {
  label?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10">
      {label && (
        <p className="text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-gold mb-2">
          {label}
        </p>
      )}
      <h1 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-normal text-cocoa leading-tight mb-3">
        {title}
      </h1>
      {description && (
        <p className="text-[0.92rem] text-warm-grey leading-relaxed max-w-lg">
          {description}
        </p>
      )}
    </div>
  );
}
