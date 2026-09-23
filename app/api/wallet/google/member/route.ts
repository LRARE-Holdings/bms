import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getStudioId } from "@/lib/studio-context";
import { loadWalletMemberCard } from "@/lib/wallet/member-card";
import { googleWalletConfigured, buildGoogleMemberSaveUrl } from "@/lib/wallet/google";

/**
 * GET /api/wallet/google/member
 *
 * The "Add to Google Wallet" button on the Check-in code page: redirects to
 * Google's save page with the signed-in member's check-in card.
 */
export async function GET(request: NextRequest) {
  if (!googleWalletConfigured()) {
    return new NextResponse("Google Wallet passes aren't available yet.", { status: 404 });
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/account/check-in", request.url), 303);
  }

  const card = await loadWalletMemberCard(user.id, await getStudioId());
  if (!card) {
    return new NextResponse("We couldn't find your membership at this studio.", { status: 404 });
  }

  try {
    return NextResponse.redirect(buildGoogleMemberSaveUrl(card), { status: 302 });
  } catch (err) {
    console.error("[wallet/google/member] Failed to build save link:", err);
    return new NextResponse("Sorry, we couldn't create your card. Please try again later.", { status: 500 });
  }
}
