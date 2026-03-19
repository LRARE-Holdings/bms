import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export function getStudioId() {
  const id = process.env.NEXT_PUBLIC_STUDIO_ID;
  if (!id) throw new Error("NEXT_PUBLIC_STUDIO_ID is not set");
  return id;
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const studioId = getStudioId();
  const { data } = await supabase
    .from("studio_memberships")
    .select("role")
    .eq("profile_id", user.id)
    .eq("studio_id", studioId)
    .single();

  return (data?.role as UserRole) ?? null;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(minimumRole: UserRole) {
  const user = await requireAuth();
  const role = await getUserRole();

  const hierarchy: Record<UserRole, number> = {
    member: 0,
    staff: 1,
    admin: 2,
  };

  if (!role || hierarchy[role] < hierarchy[minimumRole]) {
    redirect("/");
  }

  return { user, role };
}
