/**
 * Ask forma-admin to offer freed event places to the waitlist now.
 *
 * Same arrangement as promoteWaitlist() for classes: the offer email and its
 * claim window are owned by forma-admin. Without this call the places would
 * still be offered, but only on the event job's next tick.
 *
 * Never throws — a cancellation must not fail because the waitlist could not
 * be told. The event job is the backstop.
 */
export async function offerEventWaitlist(params: { studioId: string; eventId: string }) {
  const baseUrl = process.env.FORMA_ADMIN_URL;
  const secret = process.env.INTERNAL_EMAIL_SECRET;

  if (!baseUrl || !secret) {
    console.error("[event-waitlist-offer] FORMA_ADMIN_URL or INTERNAL_EMAIL_SECRET not set; leaving it to the event job");
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/api/internal/event-waitlist-offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[event-waitlist-offer] forma-admin returned ${res.status}: ${text.slice(0, 200)}`);
    }
  } catch (err) {
    console.error("[event-waitlist-offer] Failed to call forma-admin:", err);
  }
}
