import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export default async function PhonePromptBanner() {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .single();

  if (profile?.phone) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/8 px-5 py-4">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gold shrink-0 mt-0.5"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      <div className="flex-1">
        <p className="text-[0.85rem] font-semibold text-cocoa">
          Add your mobile number
        </p>
        <p className="text-[0.78rem] text-warm-grey mt-0.5 leading-relaxed">
          We&apos;d like a way to reach you about your bookings.{" "}
          <Link
            href="/account/profile"
            className="font-semibold text-gold underline-offset-2 hover:underline"
          >
            Add it to your profile
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
