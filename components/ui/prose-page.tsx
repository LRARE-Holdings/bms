export default function ProsePage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-20 px-5 md:px-8 max-w-3xl mx-auto">
      <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-normal text-cocoa leading-tight mb-2">
        {title}
      </h1>
      {lastUpdated && (
        <p className="text-[0.75rem] text-warm-grey mb-8">
          Last updated: {lastUpdated}
        </p>
      )}
      <div className="prose-burn">{children}</div>
    </section>
  );
}
