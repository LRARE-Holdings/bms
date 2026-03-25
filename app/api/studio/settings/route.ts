import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudioId } from "@/lib/studio-context";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const studioId = await getStudioId();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify admin role at this studio
    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("studio_memberships")
      .select("role")
      .eq("profile_id", user.id)
      .eq("studio_id", studioId)
      .single();

    if (membership?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { first_class_free_enabled } = body;

    if (typeof first_class_free_enabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid input: first_class_free_enabled must be a boolean" },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("studios")
      .update({ first_class_free_enabled })
      .eq("id", studioId);

    if (error) {
      console.error("Studio settings update error:", error);
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Studio settings error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
