import ProsePage from "@/components/ui/prose-page";

export const metadata = {
  title: "Cookie Policy | Burn Mat Studio",
};

export default function CookiesPage() {
  return (
    <ProsePage title="Cookie Policy" lastUpdated="March 2026">
      <h2>What Cookies We Use</h2>
      <p>
        Burn Mat Studio uses only essential cookies required for the website to
        function. We do not use analytics, advertising, or tracking cookies.
      </p>

      <h3>Session Cookies</h3>
      <p>
        When you log in, Supabase Auth sets secure, HTTP-only cookies to
        maintain your authenticated session. These are strictly necessary for
        the booking system to work and cannot be disabled.
      </p>

      <h2>Third-Party Cookies</h2>
      <p>
        Stripe may set cookies during the checkout process to prevent fraud and
        process payments securely. These are governed by{" "}
        <a
          href="https://stripe.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Stripe&apos;s privacy policy
        </a>
        .
      </p>

      <h2>Managing Cookies</h2>
      <p>
        You can manage cookies through your browser settings. Note that
        disabling essential cookies will prevent you from logging in and making
        bookings.
      </p>
    </ProsePage>
  );
}
