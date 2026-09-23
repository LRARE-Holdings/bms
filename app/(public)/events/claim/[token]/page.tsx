import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioId } from "@/lib/studio-context";
import { isUuid } from "@/lib/uuid";
import { formatPounds } from "@/lib/event-tickets";
import EventClaimClient from "./claim-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Claim Your Tickets | Burn Mat Studio",
};

function offerLapsed(expiresAt: number): boolean {
  return expiresAt <= Date.now();
}

function Notice({ title, message, href, label }: { title: string; message: string; href: string; label: string }) {
  return (
    <section className="py-20 px-5 md:px-10 max-w-[520px] mx-auto text-center">
      <div className="bg-white border border-sand rounded-2xl p-8">
        <h1 className="font-display text-2xl font-semibold text-cocoa mb-3">{title}</h1>
        <p className="text-[0.88rem] text-warm-grey">{message}</p>
        <Link
          href={href}
          className="inline-block mt-5 px-8 py-2.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors"
        >
          {label}
        </Link>
      </div>
    </section>
  );
}

export default async function EventClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const studioId = await getStudioId();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // claim_token is a uuid column; a malformed token would raise a Postgres error.
  const { data: entry } = isUuid(token)
    ? await createAdminClient()
        .from("event_waitlist")
        .select(
          "id, profile_id, status, quantity, expires_at, events:event_id(id, title, event_date, start_time, end_time, location, price_pence)"
        )
        .eq("claim_token", token)
        .eq("studio_id", studioId)
        .maybeSingle()
    : { data: null };

  if (!entry) {
    return (
      <Notice
        title="Invalid link"
        message="This link is not valid. It may have already been used, or the URL may be incomplete."
        href="/#events"
        label="See events"
      />
    );
  }

  if (!user) {
    return (
      <Notice
        title="Log in to claim your tickets"
        message="Log in with the account you joined the waitlist with, then open the link from your email again."
        href="/login"
        label="Log in"
      />
    );
  }

  if (entry.profile_id !== user.id) {
    return (
      <Notice
        title="Wrong account"
        message="This offer belongs to a different account. Log in with the account you joined the waitlist with."
        href="/account"
        label="My account"
      />
    );
  }

  if (entry.status === "claimed") {
    return (
      <Notice
        title="Already claimed"
        message="You've already claimed these tickets."
        href="/account/events"
        label="My tickets"
      />
    );
  }

  const expiresAt = entry.expires_at ? new Date(entry.expires_at).getTime() : 0;
  if (entry.status !== "offered" || offerLapsed(expiresAt)) {
    return (
      <Notice
        title="Offer expired"
        message="This offer has expired and the places have gone to the next person on the waitlist."
        href="/#events"
        label="See events"
      />
    );
  }

  const event = entry.events as unknown as {
    id: string;
    title: string;
    event_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    price_pence: number;
  };

  const dateDisplay = new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeDisplay = event.start_time
    ? event.end_time
      ? `${event.start_time.slice(0, 5)} – ${event.end_time.slice(0, 5)}`
      : event.start_time.slice(0, 5)
    : null;

  return (
    <EventClaimClient
      token={token}
      eventId={event.id}
      eventTitle={event.title}
      dateDisplay={dateDisplay}
      timeDisplay={timeDisplay}
      location={event.location}
      quantity={entry.quantity}
      totalDisplay={formatPounds(event.price_pence * entry.quantity)}
      expiresAt={expiresAt}
      profileId={user.id}
    />
  );
}
