"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ studioId }: { studioId: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Generic message prevents user enumeration
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    // Ensure studio membership exists — catches users who signed up
    // before membership creation was reliable, or who were created
    // via Supabase dashboard without a membership row.
    await fetch("/api/auth/ensure-membership", { method: "POST" });

    // Check role for redirect
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: membership } = await supabase
        .from("studio_memberships")
        .select("role")
        .eq("profile_id", user.id)
        .eq("studio_id", studioId)
        .single();

      const role = membership?.role;
      if (role === "admin" || role === "staff") {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
        if (adminUrl) {
          window.location.href = adminUrl;
          return;
        }
      }
      router.push("/account");
    } else {
      router.push("/account");
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div>
        <label className="block text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-warm-grey mb-1.5">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-4 py-3 bg-white border border-sand rounded-xl text-[0.88rem] text-cocoa placeholder:text-warm-grey/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
          placeholder="you@email.com"
        />
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-warm-grey">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-[0.72rem] font-medium text-gold hover:text-cocoa transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 pr-11 bg-white border border-sand rounded-xl text-[0.88rem] text-cocoa placeholder:text-warm-grey/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
            placeholder="Your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-grey/60 hover:text-cocoa transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
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

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-gold text-cocoa rounded-full text-[0.78rem] font-semibold tracking-[0.08em] uppercase hover:bg-wheat hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(196,169,90,0.25)] transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in...
          </span>
        ) : (
          "Log in"
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-sand" />
        <span className="text-[0.68rem] text-warm-grey/60 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-sand" />
      </div>

      {/* Sign up link */}
      <p className="text-center text-[0.82rem] text-warm-grey">
        New to Burn Mat Studio?{" "}
        <Link
          href="/signup"
          className="font-semibold text-gold hover:text-cocoa transition-colors"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
