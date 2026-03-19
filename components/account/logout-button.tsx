"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="px-5 py-2 border border-sand rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase text-warm-grey hover:border-ember hover:text-ember transition-colors"
    >
      Log out
    </button>
  );
}
