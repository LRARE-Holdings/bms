import ProsePage from "@/components/ui/prose-page";

export const metadata = {
  title: "Privacy Policy | Burn Mat Studio",
};

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy Policy" lastUpdated="March 2026">
      <h2>Data Controller</h2>
      <p>
        Lucy Healy, trading as Burn Mat Studio, is the data controller for
        personal data collected through this website. Studio address: TS16 0TA.
        Contact: <a href="mailto:hello@burnmatstudio.co.uk">hello@burnmatstudio.co.uk</a>.
      </p>

      <h2>What We Collect</h2>
      <ul>
        <li><strong>Account information:</strong> name, email address, and password when you create an account.</li>
        <li><strong>Date of birth:</strong> collected to verify you are 18 or over, and to send you a complimentary birthday class each year.</li>
        <li><strong>Booking data:</strong> class selections, dates, and attendance history.</li>
        <li><strong>Payment data:</strong> processed securely by Stripe. We do not store card details.</li>
        <li><strong>Session data:</strong> authentication cookies to keep you logged in.</li>
      </ul>

      <h2>Lawful Basis for Processing</h2>
      <p>
        Under UK GDPR, we rely on the following lawful bases to process your
        personal data:
      </p>
      <ul>
        <li>
          <strong>Contract:</strong> processing your account, bookings, and
          payments is necessary to fulfil the service you have signed up for.
        </li>
        <li>
          <strong>Legitimate interests:</strong> sending you transactional
          emails (confirmations, cancellations, receipts) and maintaining the
          security of our systems.
        </li>
        <li>
          <strong>Consent:</strong> any future marketing communications will
          only be sent with your explicit opt-in consent, which you may
          withdraw at any time.
        </li>
      </ul>

      <h2>How We Use Your Data</h2>
      <ul>
        <li>To manage your bookings and class pack credits.</li>
        <li>To send booking confirmations, cancellations, and pack receipts via email.</li>
        <li>To communicate important studio updates.</li>
      </ul>

      <h2>Third Parties</h2>
      <p>We share data with the following services, only as necessary to operate the studio:</p>
      <ul>
        <li><strong>Stripe</strong> &mdash; payment processing.</li>
        <li><strong>Supabase</strong> &mdash; database and authentication hosting.</li>
        <li><strong>Resend</strong> &mdash; transactional email delivery.</li>
        <li><strong>Vercel</strong> &mdash; website hosting.</li>
      </ul>

      <h2>Data Retention</h2>
      <p>
        We retain your account and booking data for as long as your account is
        active. You may request deletion at any time by emailing us.
      </p>

      <h2>Your Rights</h2>
      <p>
        Under UK GDPR you have the right to access, rectify, erase, restrict
        processing of, and port your personal data. To exercise any of these
        rights, contact us at{" "}
        <a href="mailto:hello@burnmatstudio.co.uk">hello@burnmatstudio.co.uk</a>.
      </p>
    </ProsePage>
  );
}
