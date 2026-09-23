import { NextRequest, NextResponse } from "next/server";
import { getStudioId } from "@/lib/studio-context";
import { loadWalletTicket } from "@/lib/wallet/ticket";
import { googleWalletConfigured, buildGoogleSaveUrl } from "@/lib/wallet/google";

/**
 * GET /api/wallet/google/[token]
 *
 * The "Add to Google Wallet" link in the ticket confirmation email: redirects
 * to Google's save page with the ticket signed into the URL.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!googleWalletConfigured()) {
    return new NextResponse("Google Wallet passes aren't available yet.", { status: 404 });
  }

  const { token } = await params;
  const ticket = await loadWalletTicket(token, await getStudioId());
  if (!ticket) {
    return new NextResponse(
      "This ticket isn't valid any more — it may have been cancelled. Check My events on the website.",
      { status: 410 }
    );
  }

  try {
    return NextResponse.redirect(buildGoogleSaveUrl(ticket), { status: 302 });
  } catch (err) {
    console.error("[wallet/google] Failed to build save link:", err);
    return new NextResponse("Sorry, we couldn't create your pass. Please try again later.", { status: 500 });
  }
}
