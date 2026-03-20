import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email/send";
import { getStudioId } from "@/lib/studio-context";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * /auth/confirm — verifies a token_hash from Supabase auth emails.
 *
 * The Forma redirect handler (useforma.co.uk/auth/callback) forwards
 * users here after resolving which studio they belong to. The URL
 * arrives with token_hash, type, and next query params.
 *
 * This route calls verifyOtp() to exchange the token for a session,
 * ensures a studio membership exists (critical for new signups),
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
      // Ensure studio membership exists — handles the signup confirmation
      // flow where the user verified their email and now has a session
      // but hasn't been linked to this studio yet.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const studioId = await getStudioId();
        const adminClient = createAdminClient();

        const { data: existing } = await adminClient
          .from("studio_memberships")
          .select("id")
          .eq("profile_id", user.id)
          .eq("studio_id", studioId)
          .single();

        if (!existing) {
          await adminClient.from("studio_memberships").insert({
            studio_id: studioId,
            profile_id: user.id,
            role: "member",
          });

          sendWelcomeEmail({ profileId: user.id, studioId });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Verification failed or missing params — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
