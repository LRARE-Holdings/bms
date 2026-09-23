import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getStudioId } from "@/lib/studio-context";
import { loadWalletMemberCard } from "@/lib/wallet/member-card";
import { appleWalletConfigured, buildAppleMemberPass } from "@/lib/wallet/apple";

/**
 * GET /api/wallet/apple/member
 *
 * The "Add to Apple Wallet" button on the Check-in code page: the signed-in
 * member's check-in card as a .pkpass.
 */
export async function GET(request: NextRequest) {
  if (!appleWalletConfigured()) {
    return new NextResponse("Apple Wallet passes aren't available yet.", { status: 404 });
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
    const pass = await buildAppleMemberPass(card);
    return new NextResponse(new Uint8Array(pass), {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="check-in-card.pkpass"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[wallet/apple/member] Failed to build pass:", err);
    return new NextResponse("Sorry, we couldn't create your card. Please try again later.", { status: 500 });
  }
}
