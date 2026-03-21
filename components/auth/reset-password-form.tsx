"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-semibold text-cocoa mb-2">
          Password updated
        </h2>
        <p className="text-[0.88rem] text-warm-grey leading-relaxed">
          Your password has been reset successfully. You can now log in with
          your new password.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2.5 mt-6 px-8 py-3 bg-gold text-cocoa text-[0.78rem] font-semibold tracking-[0.08em] uppercase rounded-full hover:bg-wheat hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(196,169,90,0.25)] transition-all duration-300"
        >
          Log in
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* New password */}
      <div>
        <label className="block text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-warm-grey mb-1.5">
          New password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            autoFocus
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

      {/* Confirm password */}
      <div>
        <label className="block text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-warm-grey mb-1.5">
          Confirm password
        </label>
        <input
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full px-4 py-3 bg-white border border-sand rounded-xl text-[0.88rem] text-cocoa placeholder:text-warm-grey/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
          placeholder="Re-enter your new password"
        />
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
            Updating password...
          </span>
        ) : (
          "Reset password"
        )}
      </button>
    </form>
  );
}
