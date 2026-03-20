import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email/send";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/account";

  // Prevent open redirect — only allow relative paths on this origin
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//")
    ? rawNext
    : "/account";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const studioId = process.env.NEXT_PUBLIC_STUDIO_ID!;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Use admin client to bypass RLS — new users have no membership yet
        // so they can't pass the admin-only INSERT policy
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

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
