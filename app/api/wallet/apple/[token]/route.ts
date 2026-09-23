import { NextRequest, NextResponse } from "next/server";
import { getStudioId } from "@/lib/studio-context";
import { loadWalletTicket } from "@/lib/wallet/ticket";
import { appleWalletConfigured, buildApplePass } from "@/lib/wallet/apple";

/**
 * GET /api/wallet/apple/[token]
 *
 * The "Add to Apple Wallet" link in the ticket confirmation email. The token
 * is the ticket's wallet_token, so no login is needed. Built fresh on every
 * request, so it always reflects the event as it is now.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!appleWalletConfigured()) {
    return new NextResponse("Apple Wallet passes aren't available yet.", { status: 404 });
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
    const pass = await buildApplePass(ticket);
    return new NextResponse(new Uint8Array(pass), {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="ticket-${ticket.ticketId.slice(0, 8)}.pkpass"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[wallet/apple] Failed to build pass:", err);
    return new NextResponse("Sorry, we couldn't create your pass. Please try again later.", { status: 500 });
  }
}
