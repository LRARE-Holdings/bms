import { emailLayout, BRAND } from "./layout";

interface PackConfirmationData {
  memberName: string;
  packType: string;
  credits: number;
  expiresAt: string;
  pricePounds: string;
}

export function packConfirmationEmail(data: PackConfirmationData) {
  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:${BRAND.cocoa};">Pack purchased</h2>
    <p style="margin:0 0 24px;font-size:14px;color:${BRAND.warmGrey};">Your class credits are ready to use.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cocoa};border-radius:12px;margin-bottom:24px;">
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.gold};">Pack</p>
          <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:${BRAND.wheat};">${data.packType} Class Pack</p>
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.gold};">Credits</p>
          <p style="margin:0 0 16px;font-size:14px;color:${BRAND.wheat};">${data.credits} classes</p>
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.gold};">Expires</p>
          <p style="margin:0 0 16px;font-size:14px;color:${BRAND.wheat};">${data.expiresAt}</p>
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.gold};">Total paid</p>
          <p style="margin:0;font-size:14px;color:${BRAND.wheat};">&pound;${data.pricePounds}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:${BRAND.warmGrey};">
      Book your first class from the
      <a href="https://burnmatstudio.co.uk/timetable" style="color:${BRAND.gold};text-decoration:none;">timetable</a>.
    </p>
  `;

  return {
    subject: `Your ${data.packType} Class Pack is ready`,
    html: emailLayout(content),
  };
}
