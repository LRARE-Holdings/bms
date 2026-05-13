import { NextResponse } from "next/server";
import { getUserRole, getStudioId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const role = await getUserRole();
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const studioId = await getStudioId();
  const admin = createAdminClient();

  const { data: memberships, error } = await admin
    .from("studio_memberships")
    .select("profile_id, role, created_at, profiles:profile_id(full_name, email, phone, date_of_birth)")
    .eq("studio_id", studioId)
    .eq("role", "member")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members = (memberships || []).map((m: any) => {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      id: m.profile_id,
      joined_at: m.created_at,
      full_name: p?.full_name ?? null,
      email: p?.email ?? null,
      phone: p?.phone ?? null,
      date_of_birth: p?.date_of_birth ?? null,
    };
  });

  return NextResponse.json({ members });
}
