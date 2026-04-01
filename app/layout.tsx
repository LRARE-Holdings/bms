import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import CookieBanner from "@/components/layout/cookie-banner";
import { ToastProvider } from "@/components/ui/toast";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Burn Mat Studio | Pilates & Yoga in Stockton-on-Tees",
  description:
    "Boutique Pilates and yoga studio. Hot Pilates, Hot Yoga, Sculpt, Cardio & more. Small classes, max 10. Book your mat today.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          {children}
          <CookieBanner />
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
