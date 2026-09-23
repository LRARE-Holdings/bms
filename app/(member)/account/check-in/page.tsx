export const dynamic = "force-dynamic";

import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, getStudioId } from "@/lib/auth";
import AccountHeader from "@/components/account/account-header";

export const metadata = {
  title: "Check-in Code | Burn Mat Studio",
};

/**
 * The member's personal check-in code. Their instructor scans it at the door
 * and they're ticked off the register for whichever class they're booked into.
 *
 * The code is "forma-member:<checkin_token>" — a random token on their studio
 * membership, never their profile id. The QR is drawn here on the server so it
 * appears instantly, even on a weak connection at the door.
 */
export default async function CheckInCodePage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const studioId = await getStudioId();

  // RLS: members can read their own membership row only.
  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase
      .from("studio_memberships")
      .select("checkin_token")
      .eq("studio_id", studioId)
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);

  const svg = membership?.checkin_token
    ? await QRCode.toString(`forma-member:${membership.checkin_token}`, {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#473728", light: "#FFFFFF" },
      })
    : null;

  return (
    <section className="py-10 px-5 md:px-10 max-w-[520px]">
      <AccountHeader
        eyebrow="At the studio"
        title="Your check-in code"
        subtitle="Show this to your instructor when you arrive and they'll tick you in for your class."
      />

      {svg ? (
        <div className="bg-white border border-sand rounded-2xl p-6 text-center">
          <div
            className="mx-auto w-full max-w-[280px] aspect-square [&>svg]:w-full [&>svg]:h-full"
            role="img"
            aria-label="Your check-in QR code"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="mt-4 font-display text-xl font-semibold text-cocoa">
            {profile?.full_name || "Member"}
          </p>
          <p className="mt-1 text-[0.78rem] text-warm-grey">
            Works for every class you book. Turn your screen brightness up if it won&apos;t scan.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-sand rounded-2xl p-8 text-center">
          <p className="text-[0.88rem] text-warm-grey">
            We couldn&apos;t find your membership at this studio. Try logging out and back in, or ask at the
            desk and we&apos;ll check you in by name.
          </p>
        </div>
      )}
    </section>
  );
}
