import { emailLayout, BRAND, esc } from "./layout";

interface WelcomeData {
  memberName: string;
}

export function welcomeEmail(data: WelcomeData) {
  const firstName = data.memberName.split(" ")[0] || "there";

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:${BRAND.cocoa};">Welcome, ${esc(firstName)}</h2>
    <p style="margin:0 0 24px;font-size:14px;color:${BRAND.warmGrey};line-height:1.6;">
      Thanks for joining Burn Mat Studio. We can't wait to see you on the mat.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="https://burnmatstudio.co.uk/account"
            style="display:inline-block;padding:12px 32px;background-color:${BRAND.gold};color:${BRAND.cocoa};font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;border-radius:50px;">
            Go to your account
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:${BRAND.warmGrey};line-height:1.6;">
      Browse our classes, book your first session, or grab a class pack for the best value.
    </p>
    <p style="margin:0;font-size:13px;color:${BRAND.warmGrey};line-height:1.6;">
      If you have any questions, just reply to this email.
    </p>
  `;

  return {
    subject: "Welcome to Burn Mat Studio",
    html: emailLayout(content),
  };
}
