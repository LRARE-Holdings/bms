import { requireRole } from "@/lib/auth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("staff");

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
