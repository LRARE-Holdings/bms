/**
 * Notify forma-admin to send the member confirmation + instructor/admin
 * notification emails for a non-Stripe booking (pack credit, membership,
 * complimentary, birthday). Stripe-paid bookings are handled directly by
 * forma-admin's Stripe webhook.
 *
 * Fire-and-forget — logs errors but never throws, so a flaky email service
 * never breaks a booking.
 */
export async function notifyBooking(params: {
  studioId: string;
  profileId: string;
  scheduleId: string;
  date: string;
  paymentMethod: "pack_credit" | "membership" | "complimentary" | "birthday";
}) {
  const baseUrl = process.env.FORMA_ADMIN_URL;
  const secret = process.env.INTERNAL_EMAIL_SECRET;

  if (!baseUrl || !secret) {
    console.error(
      "[notify-booking] FORMA_ADMIN_URL or INTERNAL_EMAIL_SECRET not set; skipping email"
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
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[notify-booking] forma-admin returned ${res.status}: ${text.slice(0, 200)}`
      );
    }
  } catch (err) {
    console.error("[notify-booking] Failed to call forma-admin:", err);
  }
}
