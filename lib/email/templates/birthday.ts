import { emailLayout, BRAND, esc } from "./layout";

interface BirthdayData {
  memberName: string;
  token: string;
  expiresAt: string;
}

export function birthdayEmail(data: BirthdayData) {
  const firstName = data.memberName.split(" ")[0] || "there";
  const redeemUrl = `https://burnmatstudio.co.uk/birthday/${data.token}`;

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:${BRAND.cocoa};">Happy Birthday, ${esc(firstName)}</h2>
    <p style="margin:0 0 24px;font-size:14px;color:${BRAND.warmGrey};line-height:1.6;">
      We hope you have a wonderful day. To celebrate, we&rsquo;d love to treat you to a free class&nbsp;&mdash; on us.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${redeemUrl}"
            style="display:inline-block;padding:12px 32px;background-color:${BRAND.gold};color:${BRAND.cocoa};font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;border-radius:50px;">
            Redeem your free class
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:${BRAND.warmGrey};line-height:1.6;">
      Click the button above, pick any class from the timetable, and book it for free. Your birthday treat is valid until <strong style="color:${BRAND.cocoa};">${esc(data.expiresAt)}</strong>.
    </p>
    <p style="margin:0;font-size:13px;color:${BRAND.warmGrey};line-height:1.6;">
      See you on the mat!
    </p>
  `;

  return {
    subject: `Happy Birthday from Burn Mat Studio`,
    html: emailLayout(content),
  };
}
