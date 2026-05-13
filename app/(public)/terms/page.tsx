import Link from "next/link";
import ProsePage from "@/components/ui/prose-page";

export const metadata = {
  title: "Terms & Conditions | Burn Mat Studio",
};

export default function TermsPage() {
  return (
    <ProsePage title="Terms &amp; Conditions" lastUpdated="May 2026">
      <h2>Account Information</h2>
      <p>
        When you create an account you agree to provide accurate personal
        details, including your full name, date of birth, email address, and a
        mobile phone number on which the studio can reach you. You are
        responsible for keeping this information up to date via your profile.
        The studio may use the contact details you provide to communicate with
        you about your bookings &mdash; see our{" "}
        <Link href="/privacy" className="text-gold underline underline-offset-2 hover:text-cocoa transition-colors">Privacy Policy</Link>{" "}
        for full details on how your data is handled.
      </p>

      <h2>Bookings</h2>
      <p>
        All bookings are subject to availability. Classes are capped at 10
        participants. Booking confirms your spot &mdash; please arrive at least
        5 minutes early.
      </p>

      <h2>Cancellations</h2>
      <p>
        You may cancel a booking at any time before the class starts. If you
        booked using a class pack credit, the credit will be returned to your
        pack. Stripe drop-in payments are non-refundable unless the class is
        cancelled by the studio.
      </p>

      <h2>Class Packs</h2>
      <p>
        Class packs are available at various price points and validity periods.
        Current pricing is displayed on the{" "}
        <Link href="/#pricing" className="text-gold underline underline-offset-2 hover:text-cocoa transition-colors">pricing page</Link>. Class packs are non-refundable
        and non-transferable. Unused credits expire at the end of the validity
        period. Credits cannot be exchanged for cash.
      </p>

      <h2>Memberships</h2>
      <p>
        Memberships are recurring subscriptions that provide access to book
        classes at no additional cost for the duration of the subscription
        period. Memberships automatically renew at the end of each billing
        cycle unless cancelled. You may cancel your membership at any time from
        your account or via the billing portal. Cancellation takes effect at the
        end of the current billing period &mdash; you retain access until then.
        Memberships are non-refundable for the current billing period.
      </p>

      <h2>Studio Conduct</h2>
      <p>
        Please respect fellow members and instructors. The studio reserves the
        right to refuse entry to anyone behaving inappropriately.
      </p>

      <h2>Liability</h2>
      <p>
        You participate in all classes at your own risk. Please inform your
        instructor of any injuries or medical conditions before class. Burn Mat
        Studio accepts no liability for personal injury or loss of property.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. Continued use of the
        website and services constitutes acceptance of updated terms.
      </p>
    </ProsePage>
  );
}
