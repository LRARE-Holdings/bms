/**
 * Ask forma-admin to offer a freed spot to the next person on the waitlist.
 *
 * Promotion lives in forma-admin because the offer email and its 30-minute
 * claim window are owned there. Until this existed, only admin-side
 * cancellations promoted anyone — a member cancelling here left the waitlist
 * untouched and the spot sat empty while people waited for it.
 *
 * Fire-and-forget — logs errors but never throws. A cancellation must not fail
 * because the waitlist could not be notified.
 */
export async function promoteWaitlist(params: {
  studioId: string;
  scheduleId: string;
  date: string;
}) {
  const baseUrl = process.env.FORMA_ADMIN_URL;
  const secret = process.env.INTERNAL_EMAIL_SECRET;

  if (!baseUrl || !secret) {
    console.error(
      "[waitlist-promote] FORMA_ADMIN_URL or INTERNAL_EMAIL_SECRET not set; skipping promotion"
    );
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/api/internal/waitlist-promote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[waitlist-promote] forma-admin returned ${res.status}: ${text.slice(0, 200)}`
      );
    }
  } catch (err) {
    console.error("[waitlist-promote] Failed to call forma-admin:", err);
  }
}
