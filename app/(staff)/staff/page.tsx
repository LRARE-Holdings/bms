export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { requireRole, getStudioId } from "@/lib/auth";
import StaffSchedule from "@/components/staff/staff-schedule";

export const metadata = {
  title: "Staff View | Burn Mat Studio",
};

export default async function StaffPage() {
  const { user, role } = await requireRole("staff");
  const supabase = await createClient();
  const studioId = await getStudioId();

  // Find the instructor record for this user (if they are staff, not admin)
  let instructorId: string | null = null;
  if (role === "staff") {
    const { data: instructor } = await supabase
      .from("instructors")
      .select("id")
      .eq("profile_id", user.id)
      .eq("studio_id", studioId)
      .single();

    instructorId = instructor?.id ?? null;
  }

  // Fetch schedule slots (filtered by instructor for staff, all for admin)
  let query = supabase
    .from("schedule")
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      classes(name, duration_mins),
      instructors(name)
    `)
    .eq("studio_id", studioId)
    .eq("is_active", true)
    .order("day_of_week")
    .order("start_time");

  if (instructorId) {
    query = query.eq("instructor_id", instructorId);
  }

  const { data: slots } = await query;

  // Normalize Supabase join results — nested relations may be arrays
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedSlots = (slots || []).map((s: any) => ({
    id: s.id,
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    classes: Array.isArray(s.classes) ? s.classes[0] : s.classes,
    instructors: Array.isArray(s.instructors) ? s.instructors[0] : s.instructors,
  }));

  return (
    <section className="py-16 px-5 md:px-8 max-w-[900px] mx-auto">
      <h1 className="font-display text-3xl font-semibold text-cocoa mb-1">
        {role === "admin" ? "All Classes" : "Your Classes"}
      </h1>
      <p className="text-[0.82rem] text-warm-grey mb-8">
        {role === "admin"
          ? "View all upcoming classes and attendees."
          : "View your upcoming classes and attendees."}
      </p>
      <StaffSchedule slots={normalizedSlots} studioId={studioId} />
    </section>
  );
}
