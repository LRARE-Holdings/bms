import { requireRole } from "@/lib/auth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import StaffSubnav from "@/components/staff/staff-subnav";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await requireRole("staff");

  return (
    <>
      <Navbar />
      <StaffSubnav role={role as "staff" | "admin"} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
