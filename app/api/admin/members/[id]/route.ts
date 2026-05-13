import { NextResponse } from "next/server";
import { getUserRole, getStudioId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const role = await getUserRole();
  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const studioId = await getStudioId();
  const admin = createAdminClient();

  // Confirm this profile belongs to this studio
  const { data: membership } = await admin
    .from("studio_memberships")
    .select("role, created_at")
    .eq("studio_id", studioId)
    .eq("profile_id", id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email, phone, date_of_birth")
    .eq("id", id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Stats: total confirmed bookings, last 30 days, favourite class
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const { count: totalCount } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", studioId)
    .eq("profile_id", id)
    .eq("status", "confirmed");

  const { count: last30Count } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", studioId)
    .eq("profile_id", id)
    .eq("status", "confirmed")
    .gte("date", thirtyDaysAgoStr);

  // Favourite class — pull all confirmed bookings joined to class name and count
  const { data: bookingsForFavourite } = await admin
    .from("bookings")
    .select("schedule:schedule_id(classes(name))")
    .eq("studio_id", studioId)
    .eq("profile_id", id)
    .eq("status", "confirmed");

  const classCounts: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (bookingsForFavourite || []).forEach((b: any) => {
    const sched = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
    const cls = sched ? (Array.isArray(sched.classes) ? sched.classes[0] : sched.classes) : null;
    const name = cls?.name;
    if (name) classCounts[name] = (classCounts[name] || 0) + 1;
  });
  let favouriteClass: string | null = null;
  let favouriteCount = 0;
  for (const [name, count] of Object.entries(classCounts)) {
    if (count > favouriteCount) {
      favouriteClass = name;
      favouriteCount = count;
    }
  }

  // Recent bookings (last 10, most recent first, including future + past)
  const { data: recent } = await admin
    .from("bookings")
    .select(
      "id, date, status, payment_method, schedule:schedule_id(start_time, classes(name), instructors(name))",
    )
    .eq("studio_id", studioId)
    .eq("profile_id", id)
    .order("date", { ascending: false })
    .limit(10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentBookings = (recent || []).map((b: any) => {
    const sched = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
    const cls = sched ? (Array.isArray(sched.classes) ? sched.classes[0] : sched.classes) : null;
    const inst = sched ? (Array.isArray(sched.instructors) ? sched.instructors[0] : sched.instructors) : null;
    return {
      id: b.id,
      date: b.date,
      status: b.status,
      payment_method: b.payment_method,
      class_name: cls?.name ?? "—",
      instructor_name: inst?.name ?? "—",
      start_time: sched?.start_time ?? null,
    };
  });

  return NextResponse.json({
    profile: {
      id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      date_of_birth: profile.date_of_birth,
      role: membership.role,
      joined_at: membership.created_at,
    },
    stats: {
      total: totalCount ?? 0,
      last30: last30Count ?? 0,
      favourite_class: favouriteClass,
    },
    recent_bookings: recentBookings,
  });
}
