import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email/send";
import { getStudioId } from "@/lib/studio-context";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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

  return NextResponse.json({ ok: true });
}
