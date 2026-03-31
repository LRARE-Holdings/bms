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

  // Calculate the target date: 3 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);
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
    // Find members at this studio whose birthday month+day matches the target date.
    // Filter by date_of_birth suffix (e.g. "-04-01") in the query to avoid fetching all members.
    const { data: members, error: membersError } = await supabase
      .from("studio_memberships")
      .select("profile_id, profiles!inner(id, date_of_birth, email, full_name)")
      .eq("studio_id", studio.id)
      .like("profiles.date_of_birth::text", `%${mmdd}`);

    if (membersError || !members) {
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
