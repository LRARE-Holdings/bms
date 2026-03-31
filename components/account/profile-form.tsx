"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { localDateStr } from "@/lib/date-utils";
import { useToast } from "@/components/ui/toast";

export default function ProfileForm({
  initialName,
  email,
  initialDateOfBirth,
}: {
  initialName: string;
  email: string;
  initialDateOfBirth: string;
}) {
  const [fullName, setFullName] = useState(initialName);
  const [dateOfBirth, setDateOfBirth] = useState(initialDateOfBirth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmed = fullName.trim();
    if (!trimmed) {
      setError("Name cannot be empty.");
      setLoading(false);
      return;
    }

    if (dateOfBirth) {
      const birth = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) {
        setError("You must be 18 or over.");
        setLoading(false);
        return;
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to update your profile.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: trimmed,
        ...(dateOfBirth ? { date_of_birth: dateOfBirth } : {}),
      })
      .eq("id", user.id);

    if (updateError) {
      setError("Failed to save changes. Please try again.");
      setLoading(false);
      return;
    }

    toast("Profile updated");
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
          required
          minLength={1}
          maxLength={100}
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

      <div>
        <label className="block text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-warm-grey mb-1.5">
          Date of birth
        </label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          max={localDateStr()}
          className="w-full px-4 py-2.5 bg-cream border border-sand rounded-xl text-[0.88rem] text-cocoa focus:outline-none focus:border-gold transition-colors"
        />
        <p className="text-[0.68rem] text-warm-grey mt-1">
          We&apos;ll send you a free class on your birthday each year.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-ember/8 border border-ember/20 rounded-xl">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ember shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[0.8rem] text-ember">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-gold text-cocoa rounded-full text-[0.72rem] font-semibold tracking-[0.06em] uppercase hover:bg-wheat active:scale-95 transition-all disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
