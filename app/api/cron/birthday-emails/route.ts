import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBirthdayEmail } from "@/lib/email/send";

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Calculate the target date: 3 days from now. `?date=YYYY-MM-DD` runs it for
  // one specific birthday instead — for catching up after missed runs. Same
  // secret, and the per-year token still stops anyone getting a second email.
  const dateParam = request.nextUrl.searchParams.get("date");
  if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }
  const targetDate = dateParam ? new Date(`${dateParam}T12:00:00Z`) : new Date();
  if (!dateParam) targetDate.setDate(targetDate.getDate() + 3);
  const targetMonth = targetDate.getMonth() + 1; // 1-based
  const targetDay = targetDate.getDate();
  const currentYear = targetDate.getFullYear();

  // Build a suffix like "-04-01" to match any year's April 1st
  const mmdd = `-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;

  // Fetch all studios
  const { data: studios, error: studiosError } = await supabase
    .from("studios")
    .select("id, domain");

  if (studiosError || !studios) {
    console.error("Failed to fetch studios:", studiosError);
    return NextResponse.json({ error: "Failed to fetch studios" }, { status: 500 });
  }

  let emailsSent = 0;
  let errors = 0;

  for (const studio of studios) {
    // Members at this studio whose birthday (month + day) is the target date.
    //
    // This used to filter with `.like("profiles.date_of_birth::text", …)`, but
    // PostgREST ignores the cast inside a filter on an embedded table, so the
    // database was asked to LIKE a date and refused. Every run errored for
    // every studio, and no birthday email was ever sent. Matching in code over
    // members who have a date of birth is plain and cheap; pages of 1,000.
    const members: { profiles: unknown }[] = [];
    let membersError: unknown = null;
    for (let from = 0; ; from += 1000) {
      const { data: page, error: pageError } = await supabase
        .from("studio_memberships")
        .select("profile_id, profiles!inner(id, date_of_birth, email, full_name)")
        .eq("studio_id", studio.id)
        .not("profiles.date_of_birth", "is", null)
        .order("profile_id")
        .range(from, from + 999);
      if (pageError) {
        membersError = pageError;
        break;
      }
      for (const row of page ?? []) {
        const dob = (row.profiles as { date_of_birth?: string | null } | null)?.date_of_birth;
        if (dob && dob.endsWith(mmdd)) members.push(row);
      }
      if (!page || page.length < 1000) break;
    }

    if (membersError) {
      console.error(`Failed to fetch members for studio ${studio.id}:`, membersError);
      errors++;
      continue;
    }

    for (const member of members) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = member.profiles as any;
      if (!profile?.date_of_birth || !profile?.email) continue;

      // Check if token already exists for this year
      const { data: existingToken } = await supabase
        .from("birthday_tokens")
        .select("id")
        .eq("studio_id", studio.id)
        .eq("profile_id", profile.id)
        .eq("birthday_year", currentYear)
        .maybeSingle();

      if (existingToken) continue; // Already sent this year

      // Calculate expiry: birthday + 14 days
      const birthday = new Date(currentYear, targetMonth - 1, targetDay);
      const expiresAt = new Date(birthday);
      expiresAt.setDate(expiresAt.getDate() + 14);

      // Create token
      const { data: token, error: tokenError } = await supabase
        .from("birthday_tokens")
        .insert({
          studio_id: studio.id,
          profile_id: profile.id,
          birthday_year: currentYear,
          expires_at: expiresAt.toISOString(),
        })
        .select("token")
        .single();

      if (tokenError || !token) {
        // Unique constraint means we already created one (race condition) — skip
        if (tokenError?.code === "23505") continue;
        console.error(`Failed to create birthday token for ${profile.id}:`, tokenError);
        errors++;
        continue;
      }

      // Send birthday email
      try {
        await sendBirthdayEmail({
          profileId: profile.id,
          studioId: studio.id,
          token: token.token,
          expiresAt: expiresAt.toISOString(),
        });
      } catch (emailErr) {
        console.error(`Failed to send birthday email to ${profile.email}:`, emailErr);
        errors++;
        continue;
      }

      emailsSent++;
    }
  }

  return NextResponse.json({
    success: true,
    emailsSent,
    errors,
    targetDate: `${targetMonth}/${targetDay}`,
  });
}
