import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * /auth/confirm — verifies a token_hash from Supabase auth emails.
 *
 * The Forma redirect handler (useforma.co.uk/auth/callback) forwards
 * users here after resolving which studio they belong to. The URL
 * arrives with token_hash, type, and next query params.
 *
 * This route calls verifyOtp() to exchange the token for a session,
 * then redirects to the `next` path (e.g. /reset-password, /account).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") ?? "/account";

  // Prevent open redirect — only allow relative paths on this origin
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/account";

  if (tokenHash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Verification failed or missing params — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
