import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ── Brand colours (mirrored from lib/email/templates/layout.ts) ─────────────

const BRAND = {
  cocoa: "#473728",
  wheat: "#DFD0A5",
  gold: "#C4A95A",
  cream: "#F5F0E8",
  sand: "#E8DCC8",
  charcoal: "#1A1A1A",
  warmGrey: "#8A8070",
};

const STUDIO_ID = "f47b1352-b1bb-4a36-a601-ebf08030e26a";
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1000;

// ── Email template (self-contained — can't import from Next.js codebase) ────

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmail(memberName: string): { subject: string; html: string } {
  const firstName = memberName.split(" ")[0] || "there";

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

  const html = `<!DOCTYPE html>
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

  return {
    subject: "Your new Burn Mat Studio account is ready",
    html,
  };
}

// ── Send email via Resend HTTP API ──────────────────────────────────────────

async function sendViaResend(
  apiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Burn Mat Studio <hello@burnmatstudio.co.uk>",
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `${res.status}: ${body}` };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Edge Function handler ───────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not set" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Parse optional body for dry-run or date override
  let dryRun = false;
  let migrationDateFrom = "2026-03-25T00:00:00Z";
  let migrationDateTo = "2026-04-01T00:00:00Z";
  try {
    const body = await req.json();
    dryRun = body?.dry_run === true;
    if (body?.migration_date_from) migrationDateFrom = body.migration_date_from;
    if (body?.migration_date_to) migrationDateTo = body.migration_date_to;
  } catch {
    // No body or invalid JSON — use defaults
  }

  // Query migrated members: studio_memberships created in the migration window
  // Exclude staff and admins (who were already in the system)
  const { data: members, error: queryError } = await supabase
    .from("studio_memberships")
    .select(
      "profile_id, profiles!inner(id, email, full_name)"
    )
    .eq("studio_id", STUDIO_ID)
    .eq("role", "member")
    .gte("created_at", migrationDateFrom)
    .lt("created_at", migrationDateTo);

  if (queryError) {
    return new Response(
      JSON.stringify({ error: `Query failed: ${queryError.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!members || members.length === 0) {
    return new Response(
      JSON.stringify({ message: "No migrated members found", sent: 0 }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  if (dryRun) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emails = members.map((m: any) => ({
      email: m.profiles?.email,
      name: m.profiles?.full_name,
    }));
    return new Response(
      JSON.stringify({
        dry_run: true,
        total: members.length,
        recipients: emails,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // Send emails in batches
  let sent = 0;
  let failed = 0;
  const failures: Array<{ email: string; error: string }> = [];

  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      batch.map(async (member: any) => {
        const profile = member.profiles;
        if (!profile?.email) return;

        const { subject, html } = buildEmail(profile.full_name || "there");
        const result = await sendViaResend(
          resendApiKey,
          profile.email,
          subject,
          html
        );

        if (result.ok) {
          sent++;
        } else {
          failed++;
          failures.push({
            email: profile.email,
            error: result.error || "Unknown error",
          });
        }
      })
    );

    // Check for unexpected rejections
    for (const r of results) {
      if (r.status === "rejected") {
        failed++;
        failures.push({
          email: "unknown",
          error: r.reason?.message || String(r.reason),
        });
      }
    }

    // Rate limit between batches
    if (i + BATCH_SIZE < members.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  return new Response(
    JSON.stringify({
      total: members.length,
      sent,
      failed,
      failures: failures.length > 0 ? failures : undefined,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
