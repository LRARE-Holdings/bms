import LoginForm from "@/components/auth/login-form";
import Image from "next/image";

export const metadata = {
  title: "Log In | Burn Mat Studio",
};

export default function LoginPage() {
  return (
    <section className="min-h-screen flex">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] bg-cocoa relative overflow-hidden flex-col justify-end p-12">
        {/* Decorative gradient orbs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 20% 80%, rgba(196,169,90,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 75% 20%, rgba(223,208,165,0.1) 0%, transparent 50%), radial-gradient(ellipse 40% 35% at 50% 50%, rgba(212,113,58,0.08) 0%, transparent 50%)",
          }}
        />

        <div className="relative z-10">
          <h2 className="font-display text-[clamp(2.6rem,4.5vw,4rem)] font-light text-wheat leading-[1.1] mb-4">
            Welcome back<br />
            to the mat.
          </h2>
          <p className="text-[0.82rem] text-warm-grey leading-relaxed max-w-xs">
            Log in to book classes, manage your packs, and keep your practice going.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Image
              src="/Logo_Brown.PNG"
              alt="Burn Mat Studio"
              width={48}
              height={48}
              className="rounded-full"
            />
          </div>

          <p className="text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-gold mb-2 text-center lg:text-left">
            Member login
          </p>
          <h1 className="font-display text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-cocoa leading-tight mb-1 text-center lg:text-left">
            Welcome back
          </h1>
          <p className="text-[0.82rem] text-warm-grey mb-8 text-center lg:text-left">
            Sign in to your account to manage bookings and packs.
          </p>

          <LoginForm />
        </div>
      </div>
    </section>
  );
}
