/**
 * Notify forma-admin to send instructor + admin cancellation notification emails.
 * The member's own cancellation email is sent locally by the caller.
 *
 * Fire-and-forget — logs errors but never throws.
 */
export async function notifyCancellation(params: {
  studioId: string;
  profileId: string;
  scheduleId: string;
  date: string;
  paymentMethod: "stripe" | "pack_credit" | "membership" | "complimentary" | "birthday";
  cancelledBy: "member" | "admin";
}) {
  const baseUrl = process.env.FORMA_ADMIN_URL;
  const secret = process.env.INTERNAL_EMAIL_SECRET;

  if (!baseUrl || !secret) {
    console.error(
      "[notify-cancellation] FORMA_ADMIN_URL or INTERNAL_EMAIL_SECRET not set; skipping email"
    );
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/api/internal/booking-emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ event: "cancelled", ...params }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[notify-cancellation] forma-admin returned ${res.status}: ${text.slice(0, 200)}`
      );
    }
  } catch (err) {
    console.error("[notify-cancellation] Failed to call forma-admin:", err);
  }
}
