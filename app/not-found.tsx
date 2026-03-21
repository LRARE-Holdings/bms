import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <div className="font-display text-[5rem] font-light text-sand leading-none mb-4">
          404
        </div>
        <h1 className="font-display text-2xl font-semibold text-cocoa mb-2">
          Page not found
        </h1>
        <p className="text-[0.88rem] text-warm-grey leading-relaxed mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-cocoa rounded-full text-[0.75rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
        >
          Back to home
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
