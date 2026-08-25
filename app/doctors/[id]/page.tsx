// app/doctors/[id]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Doctor Details Page
 * - Reads one doctor from the database by id.
 */
export default async function DoctorDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // In Next.js 15+ `params` is a Promise and must be awaited.
  const { id } = await params;

  // findUnique returns null when nothing matches that id.
  const doctor = await prisma.doctor.findUnique({ where: { id } });

  // notFound() shows the 404 page — handy for a bad or deleted id.
  if (!doctor) notFound();

  return (
    <main className="container mt-20">
      <section className="max-w-3xl mx-auto">
        <Link href="/doctors" className="text-primaryColor font-bold">
          ← Back to doctors
        </Link>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <Image
            src={doctor.photoUrl}
            alt={doctor.name}
            width={600}
            height={400}
            className="rounded-md"
          />

          <div>
            <h1 className="text-3xl font-bold text-gray-800">{doctor.name}</h1>
            <p className="mt-2 inline-block bg-primaryLight font-bold text-primaryColor p-2 rounded-lg text-xs">
              {doctor.specialization}
            </p>

            <p className="mt-4 text-gray-800 text-sm">
              Hospital: <span className="font-semibold">{doctor.hospital}</span>
            </p>

            <p className="mt-2 text-gray-800 text-sm">
              Patients: <span className="font-semibold">{doctor.totalPatients}</span>
            </p>

            <p className="mt-2 text-gray-800 text-sm">
              Rating: <span className="font-semibold">{doctor.avgRating}</span> (
              {doctor.totalRating} reviews)
            </p>

            {/*
              Passing ?doctorId=... pre-selects this doctor in the booking form.
              If the visitor isn't logged in, the dashboard guard sends them to
              /login first.
            */}
            <Link
              href={`/dashboard/appointments?doctorId=${doctor.id}`}
              className="inline-block"
            >
              <button className="btn" type="button">
                Book Appointment
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
