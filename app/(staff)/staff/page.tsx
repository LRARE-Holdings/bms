import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Staff | Burn Mat Studio",
};

export default async function StaffPage() {
  await requireRole("staff");
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
  redirect(adminUrl ?? "/account");
}
