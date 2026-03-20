import { emailLayout, BRAND, esc } from "./layout";

interface BookingConfirmationData {
  memberName: string;
  className: string;
  date: string;
  time: string;
  instructor: string;
  paymentMethod: "stripe" | "pack_credit" | "membership" | "complimentary";
}

export function bookingConfirmationEmail(data: BookingConfirmationData) {
  const paymentNote =
    data.paymentMethod === "pack_credit"
      ? "1 class pack credit has been used."
      : data.paymentMethod === "membership"
        ? "Booked with your membership."
        : data.paymentMethod === "complimentary"
          ? "This class is complimentary."
          : "Payment received via card.";

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:${BRAND.cocoa};">Booking confirmed</h2>
    <p style="margin:0 0 24px;font-size:14px;color:${BRAND.warmGrey};">You're all set. See you on the mat.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.gold};">Class</p>
          <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:${BRAND.cocoa};">${esc(data.className)}</p>
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.gold};">Date &amp; Time</p>
          <p style="margin:0 0 16px;font-size:14px;color:${BRAND.cocoa};">${esc(data.date)} at ${esc(data.time)}</p>
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.gold};">Instructor</p>
          <p style="margin:0;font-size:14px;color:${BRAND.cocoa};">${esc(data.instructor)}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:${BRAND.warmGrey};">${paymentNote}</p>
    <p style="margin:0;font-size:13px;color:${BRAND.warmGrey};">
      You can view or cancel your booking from your
      <a href="https://burnmatstudio.co.uk/account" style="color:${BRAND.gold};text-decoration:none;">account</a>.
    </p>
  `;

  return {
    subject: `Booking confirmed — ${esc(data.className)}, ${esc(data.date)}`,
    html: emailLayout(content),
  };
}
