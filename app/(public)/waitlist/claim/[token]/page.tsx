import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioId } from "@/lib/studio-context";
import WaitlistClaimClient from "./claim-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Claim Your Spot | Burn Mat Studio",
};

export default async function WaitlistClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const studioId = await getStudioId();
  const supabase = createAdminClient();

  // Look up the waitlist entry with schedule + class + instructor details
  const { data: entry } = await supabase
    .from("waitlist")
    .select(`
      id,
      status,
      expires_at,
      schedule_id,
      date,
      profile_id,
      schedule:schedule_id(
        start_time,
        classes(name, slug, duration_mins, price_pence),
        instructors(name)
      )
    `)
    .eq("claim_token", token)
    .eq("studio_id", studioId)
    .single();

  if (!entry) {
    return (
      <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto text-center">
        <div className="bg-white border border-sand rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-cocoa mb-3">
            Invalid link
          </h1>
          <p className="text-[0.88rem] text-warm-grey">
            This waitlist link is not valid. It may have already been used or
            the URL may be incorrect.
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

  // Normalize Supabase joins (may be arrays)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sched = Array.isArray(entry.schedule) ? entry.schedule[0] : (entry.schedule as any);
  const cls = Array.isArray(sched?.classes) ? sched.classes[0] : sched?.classes;
  const inst = Array.isArray(sched?.instructors) ? sched.instructors[0] : sched?.instructors;

  const className = cls?.name || "Class";
  const startTime = sched?.start_time?.slice(0, 5) || "";
  const durationMins = cls?.duration_mins || 0;
  const pricePence = cls?.price_pence || 0;
  const instructorName = inst?.name || "Instructor";

  const dateObj = new Date(entry.date + "T00:00:00");
  const dateDisplay = dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Already claimed
  if (entry.status === "claimed") {
    return (
      <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto text-center">
        <div className="bg-white border border-sand rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-cocoa mb-3">
            Spot already claimed
          </h1>
          <p className="text-[0.88rem] text-warm-grey">
            This spot has already been claimed. Check your bookings to see your
            confirmed classes.
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

  // Not in offered status (waiting, expired, cancelled)
  if (entry.status !== "offered") {
    const message =
      entry.status === "expired"
        ? "This offer has expired. The spot has been offered to the next person on the waitlist."
        : "This waitlist offer is no longer available.";

    return (
      <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto text-center">
        <div className="bg-white border border-sand rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-cocoa mb-3">
            Offer expired
          </h1>
          <p className="text-[0.88rem] text-warm-grey">{message}</p>
          <a
            href="/account"
            className="inline-block mt-5 px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
          >
            Browse timetable
          </a>
        </div>
      </section>
    );
  }

  // Check if already expired by time
  const expiresAt = entry.expires_at ? new Date(entry.expires_at).getTime() : 0;
  const now = Date.now();

  if (expiresAt <= now) {
    return (
      <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto text-center">
        <div className="bg-white border border-sand rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-cocoa mb-3">
            Offer expired
          </h1>
          <p className="text-[0.88rem] text-warm-grey">
            This offer has expired. The spot has been offered to the next person
            on the waitlist.
          </p>
          <a
            href="/account"
            className="inline-block mt-5 px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
          >
            Browse timetable
          </a>
        </div>
      </section>
    );
  }

  return (
    <WaitlistClaimClient
      token={token}
      className={className}
      dateDisplay={dateDisplay}
      startTime={startTime}
      durationMins={durationMins}
      instructorName={instructorName}
      expiresAt={expiresAt}
      scheduleId={entry.schedule_id}
      date={entry.date}
      pricePence={pricePence}
      studioId={studioId}
    />
  );
}
