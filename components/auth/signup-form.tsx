"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const studioId = process.env.NEXT_PUBLIC_STUDIO_ID;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, ...(studioId && { studio_id: studioId }) },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If email confirmation is required
    if (data.user && !data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    // If auto-confirmed (e.g. in dev), create membership via API and redirect
    if (data.user && data.session) {
      await fetch("/api/auth/ensure-membership", { method: "POST" });
      router.push("/account");
      router.refresh();
    }

    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-semibold text-cocoa mb-2">
          Check your email
        </h2>
        <p className="text-[0.88rem] text-warm-grey leading-relaxed">
          We&apos;ve sent a confirmation link to{" "}
          <strong className="text-cocoa">{email}</strong>.
          Click the link to activate your account and start booking.
        </p>
        <Link
          href="/login"
          className="inline-block mt-6 text-[0.78rem] font-semibold text-gold hover:text-cocoa transition-colors"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Full name */}
      <div>
        <label className="block text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-warm-grey mb-1.5">
          Full name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
          className="w-full px-4 py-3 bg-white border border-sand rounded-xl text-[0.88rem] text-cocoa placeholder:text-warm-grey/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
          placeholder="Your full name"
        />
      </div>

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
        <label className="block text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-warm-grey mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full px-4 py-3 pr-11 bg-white border border-sand rounded-xl text-[0.88rem] text-cocoa placeholder:text-warm-grey/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
            placeholder="At least 6 characters"
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
            Creating account...
          </span>
        ) : (
          "Create account"
        )}
      </button>

      {/* Terms note */}
      <p className="text-[0.68rem] text-warm-grey/70 text-center leading-relaxed">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-gold hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-gold hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-sand" />
        <span className="text-[0.68rem] text-warm-grey/60 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-sand" />
      </div>

      {/* Login link */}
      <p className="text-center text-[0.82rem] text-warm-grey">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-gold hover:text-cocoa transition-colors"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
