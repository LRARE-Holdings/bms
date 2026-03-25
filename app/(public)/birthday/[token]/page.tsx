import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioId } from "@/lib/studio-context";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Birthday Treat | Burn Mat Studio",
};

export default async function BirthdayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const studioId = await getStudioId();
  const supabase = createAdminClient();

  const { data: birthdayToken } = await supabase
    .from("birthday_tokens")
    .select("id, status, expires_at, profile_id")
    .eq("token", token)
    .eq("studio_id", studioId)
    .single();

  // Invalid token
  if (!birthdayToken) {
    return (
      <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto text-center">
        <div className="bg-white border border-sand rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-cocoa mb-3">
            Invalid link
          </h1>
          <p className="text-[0.88rem] text-warm-grey">
            This birthday treat link is not valid. It may have already been used
            or the URL may be incorrect.
          </p>
          <a
            href="/"
            className="inline-block mt-5 px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
          >
            Go to homepage
          </a>
        </div>
      </section>
    );
  }

  // Already used
  if (birthdayToken.status === "used") {
    return (
      <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto text-center">
        <div className="bg-white border border-sand rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-cocoa mb-3">
            Already redeemed
          </h1>
          <p className="text-[0.88rem] text-warm-grey">
            You&apos;ve already used your birthday treat. Check your bookings to
            see your confirmed classes.
          </p>
          <a
            href="/account/bookings"
            className="inline-block mt-5 px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
          >
            My bookings
          </a>
        </div>
      </section>
    );
  }

  // Expired
  const expiresAt = new Date(birthdayToken.expires_at).getTime();
  if (birthdayToken.status === "expired" || expiresAt <= Date.now()) {
    return (
      <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto text-center">
        <div className="bg-white border border-sand rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-cocoa mb-3">
            Offer expired
          </h1>
          <p className="text-[0.88rem] text-warm-grey">
            Sorry, your birthday treat has expired. Keep an eye on your inbox
            next year for another one!
          </p>
          <a
            href="/timetable"
            className="inline-block mt-5 px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
          >
            Browse timetable
          </a>
        </div>
      </section>
    );
  }

  // Valid — show redemption page with link to timetable
  const expiryDisplay = new Date(birthdayToken.expires_at).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "long" }
  );

  return (
    <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto text-center">
      <div className="bg-white border border-sand rounded-2xl p-8">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gold/10 flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gold"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold text-cocoa mb-2">
          Happy Birthday!
        </h1>
        <p className="text-[0.88rem] text-warm-grey mb-6 leading-relaxed">
          You have a free class waiting for you. Browse the timetable, pick any
          class you fancy, and book it on us.
        </p>
        <a
          href={`/timetable?birthday_token=${token}`}
          className="inline-block px-8 py-3 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(196,169,90,0.25)] transition-all duration-300"
        >
          Choose a class
        </a>
        <p className="text-[0.68rem] text-warm-grey mt-4">
          Valid until {expiryDisplay}
        </p>
      </div>
    </section>
  );
}
