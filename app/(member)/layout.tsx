import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AccountSidebar from "@/components/account/account-sidebar";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-cream">
      <AccountSidebar
        profileName={profile?.full_name || ""}
        profileEmail={profile?.email || ""}
      />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
    </div>
  );
}
