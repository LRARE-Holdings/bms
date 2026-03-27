import Countdown from "./countdown";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Coming Soon | Burn Mat Studio",
};

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-sm text-center">
        <img
          src="/Burn_Brown.svg"
          alt="Burn Mat Studio"
          className="mx-auto mb-8 h-16"
        />
        <h1 className="font-display text-2xl font-semibold text-cocoa mb-2">
          We&apos;re almost ready
        </h1>
        <p className="text-[0.88rem] text-warm-grey mb-6">
          Our new booking platform launches on 1st April.
        </p>

        <Countdown />

        <p className="text-[0.78rem] text-warm-grey mb-4">
          Have an early access password?
        </p>

        <form action="/gate" method="POST" className="space-y-3">
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            autoFocus
            className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm text-cocoa placeholder:text-warm-grey/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
          {hasError && (
            <p className="text-[0.8rem] text-ember">
              Incorrect password. Please try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-cocoa py-3 text-[0.78rem] font-semibold tracking-[0.06em] uppercase text-wheat hover:bg-gold hover:text-cocoa transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
