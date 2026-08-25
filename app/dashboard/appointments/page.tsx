// app/dashboard/appointments/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { bookAppointmentAction, cancelMyAppointmentAction } from "./actions";

/**
 * Book an appointment, and see the ones already booked.
 *
 * `searchParams` optionally carries ?doctorId=... so the "Book appointment"
 * button on a doctor's page can pre-select that doctor.
 */
export default async function MyAppointmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string; doctorId?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  const [doctors, appointments] = await Promise.all([
    prisma.doctor.findMany({ orderBy: { name: "asc" } }),
    prisma.appointment.findMany({
      where: { patientId: user.id },
      include: { doctor: true },
      orderBy: { scheduledAt: "desc" },
    }),
  ]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* ---------- Booking form ---------- */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-gray-800">Book an appointment</h2>

        {params?.error && (
          <p className="mt-3 text-xs font-bold text-primaryColor">{params.error}</p>
        )}
        {params?.success && (
          <p className="mt-3 text-xs font-bold text-green-700">{params.success}</p>
        )}

        {doctors.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            There are no doctors to book with yet. Please check back soon.
          </p>
        ) : (
          <form action={bookAppointmentAction} className="mt-5 space-y-4">
            <div>
              <label
                className="mb-2 block text-xs font-bold text-gray-800"
                htmlFor="doctorId"
              >
                Doctor
              </label>
              <select
                id="doctorId"
                name="doctorId"
                required
                // Pre-selects the doctor if we arrived from their page.
                defaultValue={params?.doctorId ?? ""}
                className="input-field"
              >
                <option value="">Choose a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} — {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="mb-2 block text-xs font-bold text-gray-800"
                htmlFor="scheduledAt"
              >
                Date and time
              </label>
              <input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-gray-800" htmlFor="reason">
                Reason for the visit (optional)
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={3}
                placeholder="Persistent headache for two weeks..."
                className="input-field"
              />
            </div>

            <button type="submit" className="btn w-full">
              Request appointment
            </button>

            <p className="text-[0.7rem] text-gray-500">
              Your request starts as <strong>Pending</strong>. The hospital will
              confirm it shortly.
            </p>
          </form>
        )}
      </section>

      {/* ---------- Existing appointments ---------- */}
      <section className="space-y-4">
        <h2 className="font-bold text-gray-800">
          My appointments ({appointments.length})
        </h2>

        {appointments.length === 0 ? (
          <p className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-600">
            You haven't booked anything yet. Use the form to request your first
            appointment, or{" "}
            <Link href="/doctors" className="font-bold text-primaryColor">
              browse our doctors
            </Link>
            .
          </p>
        ) : (
          appointments.map((appointment) => {
            // Only future appointments that are still active can be cancelled.
            const canCancel =
              appointment.scheduledAt > new Date() &&
              appointment.status !== "CANCELLED" &&
              appointment.status !== "COMPLETED";

            return (
              <article
                key={appointment.id}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{appointment.doctor.name}</h3>
                    <p className="text-xs text-primaryColor">
                      {appointment.doctor.specialization}
                    </p>
                    <p className="mt-2 text-sm text-gray-800">
                      {formatDateTime(appointment.scheduledAt)}
                    </p>
                    {appointment.reason && (
                      <p className="mt-1 text-xs text-gray-600">{appointment.reason}</p>
                    )}
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                    {appointment.status}
                  </span>
                </div>

                {canCancel && (
                  <form action={cancelMyAppointmentAction} className="mt-3">
                    <input type="hidden" name="id" value={appointment.id} />
                    <button
                      type="submit"
                      className="text-xs font-bold text-primaryColor hover:underline"
                    >
                      Cancel this appointment
                    </button>
                  </form>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
