import { getResend } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingConfirmationEmail } from "./templates/booking-confirmation";
import { packConfirmationEmail } from "./templates/pack-confirmation";
import { bookingCancellationEmail } from "./templates/booking-cancellation";
import { welcomeEmail } from "./templates/welcome";
import { birthdayEmail } from "./templates/birthday";

async function getStudioEmailConfig(studioId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("studios")
    .select("email_from, name")
    .eq("id", studioId)
    .single();

  return {
    from: data?.email_from || "hello@burnmatstudio.co.uk",
    studioName: data?.name || "Burn Mat Studio",
  };
}

async function getProfileEmail(profileId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", profileId)
    .single();

  return {
    email: data?.email || "",
    name: data?.full_name || "",
  };
}

async function getBookingDetails(
  scheduleId: string,
  supabase: ReturnType<typeof createAdminClient>
) {
  const { data } = await supabase
    .from("schedule")
    .select("start_time, classes(name), instructors(name)")
    .eq("id", scheduleId)
    .single();

  // Supabase joins may return arrays — normalize
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cls = Array.isArray(data?.classes) ? data.classes[0] : (data?.classes as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inst = Array.isArray(data?.instructors) ? data.instructors[0] : (data?.instructors as any);

  return {
    className: cls?.name || "Class",
    instructor: inst?.name || "Instructor",
    time: data?.start_time?.slice(0, 5) || "",
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Log email failures to the database for visibility.
 * Falls back to console.error if DB insert fails.
 */
async function logEmailFailure(
  type: string,
  recipient: string,
  error: unknown,
  context: Record<string, string>
) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to send ${type} email to ${recipient}:`, message);

  try {
    const supabase = createAdminClient();
    await supabase.from("email_failures").insert({
      email_type: type,
      recipient,
      error_message: message.slice(0, 500),
      context: JSON.stringify(context),
    });
  } catch {
    // DB logging failed — console.error above is our fallback
  }
}

export async function sendBookingConfirmation({
  profileId,
  studioId,
  scheduleId,
  date,
  paymentMethod,
}: {
  profileId: string;
  studioId: string;
  scheduleId: string;
  date: string;
  paymentMethod: "stripe" | "pack_credit" | "membership" | "complimentary" | "birthday";
}) {
  try {
    const [config, profile, details] = await Promise.all([
      getStudioEmailConfig(studioId),
      getProfileEmail(profileId),
      getBookingDetails(scheduleId, createAdminClient()),
    ]);

    if (!profile.email) return;

    const { subject, html } = bookingConfirmationEmail({
      memberName: profile.name,
      className: details.className,
      date: formatDate(date),
      time: details.time,
      instructor: details.instructor,
      paymentMethod,
    });

    const { error } = await getResend().emails.send({
      from: `${config.studioName} <${config.from}>`,
      to: profile.email,
      subject,
      html,
    });

    if (error) {
      await logEmailFailure("booking_confirmation", profile.email, error, {
        profileId,
        studioId,
        scheduleId,
        date,
      });
    }
  } catch (err) {
    await logEmailFailure("booking_confirmation", profileId, err, {
      profileId,
      studioId,
      scheduleId,
      date,
    });
  }
}

export async function sendPackConfirmation({
  profileId,
  studioId,
  packType,
  credits,
  expiresAt,
  pricePounds,
}: {
  profileId: string;
  studioId: string;
  packType: string;
  credits: number;
  expiresAt: string;
  pricePounds?: string;
}) {
  try {
    const [config, profile] = await Promise.all([
      getStudioEmailConfig(studioId),
      getProfileEmail(profileId),
    ]);

    if (!profile.email) return;

    const resolvedPrice = pricePounds || (packType === "10" ? "75.00" : "37.50");
    const expiryFormatted = new Date(expiresAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const { subject, html } = packConfirmationEmail({
      memberName: profile.name,
      packType,
      credits,
      expiresAt: expiryFormatted,
      pricePounds: resolvedPrice,
    });

    const { error } = await getResend().emails.send({
      from: `${config.studioName} <${config.from}>`,
      to: profile.email,
      subject,
      html,
    });

    if (error) {
      await logEmailFailure("pack_confirmation", profile.email, error, {
        profileId,
        studioId,
        packType,
      });
    }
  } catch (err) {
    await logEmailFailure("pack_confirmation", profileId, err, {
      profileId,
      studioId,
      packType,
    });
  }
}

export async function sendBookingCancellation({
  profileId,
  studioId,
  scheduleId,
  date,
  creditRefunded,
  paymentMethod,
}: {
  profileId: string;
  studioId: string;
  scheduleId: string;
  date: string;
  creditRefunded: boolean;
  paymentMethod?: string;
}) {
  try {
    const [config, profile, details] = await Promise.all([
      getStudioEmailConfig(studioId),
      getProfileEmail(profileId),
      getBookingDetails(scheduleId, createAdminClient()),
    ]);

    if (!profile.email) return;

    const { subject, html } = bookingCancellationEmail({
      memberName: profile.name,
      className: details.className,
      date: formatDate(date),
      time: details.time,
      creditRefunded,
      paymentMethod,
    });

    const { error } = await getResend().emails.send({
      from: `${config.studioName} <${config.from}>`,
      to: profile.email,
      subject,
      html,
    });

    if (error) {
      await logEmailFailure("booking_cancellation", profile.email, error, {
        profileId,
        studioId,
        scheduleId,
        date,
      });
    }
  } catch (err) {
    await logEmailFailure("booking_cancellation", profileId, err, {
      profileId,
      studioId,
      scheduleId,
      date,
    });
  }
}

export async function sendWelcomeEmail({
  profileId,
  studioId,
}: {
  profileId: string;
  studioId: string;
}) {
  try {
    const [config, profile] = await Promise.all([
      getStudioEmailConfig(studioId),
      getProfileEmail(profileId),
    ]);

    if (!profile.email) return;

    const { subject, html } = welcomeEmail({
      memberName: profile.name,
    });

    const { error } = await getResend().emails.send({
      from: `${config.studioName} <${config.from}>`,
      to: profile.email,
      subject,
      html,
    });

    if (error) {
      await logEmailFailure("welcome", profile.email, error, {
        profileId,
        studioId,
      });
    }
  } catch (err) {
    await logEmailFailure("welcome", profileId, err, {
      profileId,
      studioId,
    });
  }
}

export async function sendBirthdayEmail({
  profileId,
  studioId,
  token,
  expiresAt,
}: {
  profileId: string;
  studioId: string;
  token: string;
  expiresAt: string;
}) {
  try {
    const [config, profile] = await Promise.all([
      getStudioEmailConfig(studioId),
      getProfileEmail(profileId),
    ]);

    if (!profile.email) return;

    const expiryFormatted = new Date(expiresAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const { subject, html } = birthdayEmail({
      memberName: profile.name,
      token,
      expiresAt: expiryFormatted,
    });

    const { error } = await getResend().emails.send({
      from: `${config.studioName} <${config.from}>`,
      to: profile.email,
      subject,
      html,
    });

    if (error) {
      await logEmailFailure("birthday", profile.email, error, {
        profileId,
        studioId,
        token,
      });
    }
  } catch (err) {
    await logEmailFailure("birthday", profileId, err, {
      profileId,
      studioId,
      token,
    });
  }
}
