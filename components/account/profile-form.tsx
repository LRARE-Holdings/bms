"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [fullName, setFullName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    setSaved(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-warm-grey mb-1.5">
          Full name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-2.5 bg-cream border border-sand rounded-xl text-[0.88rem] text-cocoa focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div>
        <label className="block text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-warm-grey mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-4 py-2.5 bg-sand/50 border border-sand rounded-xl text-[0.88rem] text-warm-grey cursor-not-allowed"
        />
        <p className="text-[0.68rem] text-warm-grey mt-1">
          Contact us to change your email address.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-gold text-cocoa rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat transition-colors disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
        {saved && (
          <span className="text-[0.78rem] text-gold font-medium">Saved!</span>
        )}
      </div>
    </form>
  );
}
