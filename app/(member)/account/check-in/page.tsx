export const dynamic = "force-dynamic";

import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, getStudioId } from "@/lib/auth";
import AccountHeader from "@/components/account/account-header";
import { appleWalletConfigured } from "@/lib/wallet/apple";
import { googleWalletConfigured } from "@/lib/wallet/google";

export const metadata = {
  title: "Check-in Code | Burn Mat Studio",
};

/**
 * The member's personal check-in code. Their instructor scans it at the door
 * and they're ticked off the register for whichever class they're booked into.
 *
 * The code is "forma-member:<checkin_token>" — a random token on their studio
 * membership, never their profile id. The QR is drawn here on the server so it
 * appears instantly, even on a weak connection at the door. The wallet buttons
 * put the same code in Apple/Google Wallet, so it's there without signing in.
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

  const showApple = appleWalletConfigured();
  const showGoogle = googleWalletConfigured();

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
          {(showApple || showGoogle) && (
            <div className="mt-6 flex flex-col gap-2.5 border-t border-sand pt-6 sm:flex-row sm:justify-center">
              {showApple && (
                // A full request, not a page: the route returns a pass file or redirects to Google.
                // eslint-disable-next-line @next/next/no-html-link-for-pages
                <a
                  href="/api/wallet/apple/member"
                  className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-[0.85rem] font-medium text-white transition-opacity hover:opacity-85"
                >
                  Add to Apple Wallet
                </a>
              )}
              {showGoogle && (
                // A full request, not a page: the route returns a pass file or redirects to Google.
                // eslint-disable-next-line @next/next/no-html-link-for-pages
                <a
                  href="/api/wallet/google/member"
                  className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-[0.85rem] font-medium text-white transition-opacity hover:opacity-85"
                >
                  Add to Google Wallet
                </a>
              )}
            </div>
          )}
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
