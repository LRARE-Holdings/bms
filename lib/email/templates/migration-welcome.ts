import { emailLayout, BRAND, esc } from "./layout";

interface MigrationWelcomeData {
  memberName: string;
}

export function migrationWelcomeEmail(data: MigrationWelcomeData) {
  const firstName = data.memberName.split(" ")[0] || "there";

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:${BRAND.cocoa};">
      We&rsquo;ve got a new home, ${esc(firstName)}
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:${BRAND.warmGrey};line-height:1.6;">
      Burn Mat Studio has a brand new booking system and your account is ready to go &mdash; you just need to set a password.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="https://burnmatstudio.co.uk/forgot-password"
            style="display:inline-block;padding:12px 32px;background-color:${BRAND.gold};color:${BRAND.cocoa};font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;border-radius:50px;">
            Set up your password
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};border-radius:12px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.gold};">
            How it works
          </p>
          <p style="margin:0 0 16px;font-size:13px;color:${BRAND.cocoa};line-height:1.7;">
            1. Click the button above<br/>
            2. Enter your email address<br/>
            3. Check your inbox for a password reset link<br/>
            4. Set your new password and you&rsquo;re in
          </p>
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${BRAND.gold};">
            What you can do
          </p>
          <p style="margin:0;font-size:13px;color:${BRAND.cocoa};line-height:1.7;">
            Browse the timetable, book classes, buy class packs, and manage
            everything from your account &mdash; all in one place.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:${BRAND.warmGrey};line-height:1.6;">
      If you have any trouble, just reply to this email and we&rsquo;ll help you out.
    </p>
    <p style="margin:0;font-size:13px;color:${BRAND.warmGrey};line-height:1.6;">
      See you on the mat.
    </p>
  `;

  return {
    subject: "Your new Burn Mat Studio account is ready",
    html: emailLayout(content),
  };
}
