/** Escape user-supplied strings before interpolating into HTML email templates */
export function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BRAND = {
  cocoa: "#473728",
  wheat: "#DFD0A5",
  gold: "#C4A95A",
  cream: "#F5F0E8",
  sand: "#E8DCC8",
  charcoal: "#1A1A1A",
  warmGrey: "#8A8070",
};

export function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:${BRAND.cream};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:24px 32px;background-color:${BRAND.cocoa};border-radius:16px 16px 0 0;">
              <img src="https://burnmatstudio.co.uk/burn-light.png" alt="Burn Mat Studio" width="180" style="display:block;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;background-color:#ffffff;border-left:1px solid ${BRAND.sand};border-right:1px solid ${BRAND.sand};">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 28px;background-color:${BRAND.charcoal};border-radius:0 0 16px 16px;">
              <p style="margin:0;font-size:12px;color:${BRAND.warmGrey};line-height:1.5;">
                Burn Mat Studio &middot; TS16 0TA<br/>
                <a href="https://burnmatstudio.co.uk" style="color:${BRAND.gold};text-decoration:none;">burnmatstudio.co.uk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { BRAND };
