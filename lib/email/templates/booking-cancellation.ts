import { emailLayout, BRAND, esc } from "./layout";

interface BookingCancellationData {
  memberName: string;
  className: string;
  date: string;
  time: string;
  creditRefunded: boolean;
  paymentMethod?: string;
  /** Card refund issued with this cancellation, in pence */
  refundPence?: number | null;
  refundFailed?: boolean;
}

export function bookingCancellationEmail(data: BookingCancellationData) {
  const creditNote = data.creditRefunded
    ? "Your class pack credit has been refunded."
    : data.paymentMethod === "complimentary"
      ? "This was a complimentary class \u2014 no refund is applicable."
      : data.paymentMethod === "birthday"
        ? "This was your birthday treat \u2014 no refund is applicable."
        : data.paymentMethod === "membership"
        ? "This class was booked with your membership."
        : data.refundPence && data.refundPence > 0
          ? `A refund of \u00a3${(data.refundPence / 100).toFixed(2)} has been issued to the card you paid with. It usually takes 5\u201310 working days to appear on your statement.`
          : data.refundFailed
            ? "We're arranging a refund to the card you paid with. If you don't see it within a few days, please contact us."
            : data.paymentMethod === "stripe"
              ? "Your card payment has already been refunded."
              : "";

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:${BRAND.cocoa};">Booking cancelled</h2>
    <p style="margin:0 0 24px;font-size:14px;color:${BRAND.warmGrey};">Your booking has been cancelled.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};border-radius:12px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.gold};">Class</p>
          <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:${BRAND.cocoa};">${esc(data.className)}</p>
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.gold};">Date &amp; Time</p>
          <p style="margin:0;font-size:14px;color:${BRAND.cocoa};">${esc(data.date)} at ${esc(data.time)}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:${BRAND.warmGrey};">${creditNote}</p>
    <p style="margin:0;font-size:13px;color:${BRAND.warmGrey};">
      Want to rebook? Check the
      <a href="https://burnmatstudio.co.uk/timetable" style="color:${BRAND.gold};text-decoration:none;">timetable</a>.
    </p>
  `;

  return {
    subject: `Booking cancelled — ${esc(data.className)}, ${esc(data.date)}`,
    html: emailLayout(content),
  };
}
