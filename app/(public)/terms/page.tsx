import ProsePage from "@/components/ui/prose-page";

export const metadata = {
  title: "Terms & Conditions | Burn Mat Studio",
};

export default function TermsPage() {
  return (
    <ProsePage title="Terms &amp; Conditions" lastUpdated="March 2026">
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
      <ul>
        <li><strong>5 Class Pack:</strong> &pound;37.50. Valid for 4 weeks from purchase.</li>
        <li><strong>10 Class Pack:</strong> &pound;75.00. Valid for 6 weeks from purchase.</li>
      </ul>
      <p>
        Class packs are non-refundable and non-transferable. Unused credits
        expire at the end of the validity period. Credits cannot be exchanged
        for cash.
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
