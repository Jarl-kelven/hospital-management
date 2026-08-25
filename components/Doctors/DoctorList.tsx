// components/Doctors/DoctorList.tsx
import DoctorCard from "./DoctorCard";
import { prisma } from "../../lib/prisma";

/**
 * DoctorList
 * - Reads doctors from the database (this replaced the old data/doctors.ts array).
 * - `async` works because this is a Server Component: it runs on the server,
 *   fetches the rows, and sends finished HTML to the browser.
 */
export default async function DoctorList({ limit }: { limit?: number }) {
  const doctors = await prisma.doctor.findMany({
    orderBy: { createdAt: "asc" },
    // `take` is Prisma's LIMIT — the home page shows only the first few.
    take: limit,
  });

  if (doctors.length === 0) {
    return (
      <p className="text-center text-sm text-gray-600">
        Our doctors are being added shortly. Please check back soon.
      </p>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {doctors.map((doctor) => (
        <DoctorCard key={doctor.id} doctor={doctor} />
      ))}
    </section>
  );
}
