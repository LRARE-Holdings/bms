export const dynamic = "force-dynamic";

import { requireRole, getStudioId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import MembersTable from "@/components/staff/members-table";

export const metadata = {
  title: "Members | Burn Mat Studio",
};

interface MemberRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  joined_at: string;
}

export default async function MembersPage() {
  await requireRole("admin");
  const studioId = await getStudioId();
  const admin = createAdminClient();

  const { data: memberships } = await admin
    .from("studio_memberships")
    .select(
      "profile_id, created_at, profiles:profile_id(full_name, email, phone, date_of_birth)",
    )
    .eq("studio_id", studioId)
    .eq("role", "member")
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members: MemberRow[] = (memberships || []).map((m: any) => {
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

  return (
    <section className="py-10 px-5 md:px-8 max-w-[900px] mx-auto">
      <p className="text-[0.62rem] font-semibold tracking-[0.2em] uppercase text-gold mb-2">
        Admin
      </p>
      <h1 className="font-display text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-cocoa leading-tight mb-1">
        Members
      </h1>
      <p className="text-[0.82rem] text-warm-grey mb-8">
        {members.length} {members.length === 1 ? "member" : "members"} at Burn Mat Studio. Tap a row to view full profile.
      </p>

      <MembersTable members={members} />
    </section>
  );
}
