export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import ProfileForm from "@/components/account/profile-form";
import AccountHeader from "@/components/account/account-header";

export const metadata = {
  title: "Edit Profile | Burn Mat Studio",
};

export default async function ProfilePage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, date_of_birth")
    .eq("id", user.id)
    .single();

  return (
    <section className="py-10 px-5 md:px-10 max-w-2xl">
      <AccountHeader
        eyebrow="Profile"
        title="Edit profile"
        subtitle="Update your name and personal details."
      />
      <ProfileForm
        initialName={profile?.full_name || ""}
        email={profile?.email || ""}
        initialDateOfBirth={profile?.date_of_birth || ""}
      />
    </section>
  );
}
