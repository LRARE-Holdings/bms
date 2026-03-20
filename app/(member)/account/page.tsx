export const dynamic = "force-dynamic";

import TimetableView from "@/components/timetable/timetable-view";
import AccountHeader from "@/components/account/account-header";
import { getStudioId } from "@/lib/studio-context";

export const metadata = {
  title: "Book a Class | Burn Mat Studio",
};

export default async function AccountPage() {
  const studioId = await getStudioId();

  return (
    <section className="py-10 px-5 md:px-10 max-w-275">
      <AccountHeader
        eyebrow="Book a class"
        title="Class timetable"
        subtitle="Browse the weekly schedule and book your spot. Use a pack credit or pay per class."
      />
      <TimetableView studioId={studioId} />
    </section>
  );
}
