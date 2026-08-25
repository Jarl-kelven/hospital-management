// app/admin/appointments/page.tsx
import type { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { updateAppointmentStatusAction } from "./actions";

/**
 * Every appointment in the system, newest first, with buttons to confirm,
 * complete or cancel each one.
 */
export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  const appointments = await prisma.appointment.findMany({
    // We need the patient's name and the doctor's name, and both live in
    // other tables — `include` fetches them alongside the appointment.
    include: {
      patient: { select: { name: true, email: true } },
      doctor: { select: { name: true, specialization: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">
        Appointments ({appointments.length})
      </h2>

      {params?.error && (
        <p className="text-xs font-bold text-primaryColor">{params.error}</p>
      )}
      {params?.success && (
        <p className="text-xs font-bold text-green-700">{params.success}</p>
      )}

      {appointments.length === 0 ? (
        <p className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-600">
          No appointments have been booked yet.
        </p>
      ) : (
        appointments.map((appointment) => (
          <article
            key={appointment.id}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-800">
                  {appointment.patient.name}{" "}
                  <span className="font-normal text-gray-600">with</span>{" "}
                  {appointment.doctor.name}
                </h3>
                <p className="text-xs text-gray-600">
                  {appointment.doctor.specialization} · {appointment.patient.email}
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-800">
                  {formatDateTime(appointment.scheduledAt)}
                </p>
                {appointment.reason && (
                  <p className="mt-1 text-xs text-gray-600">
                    Reason: {appointment.reason}
                  </p>
                )}
              </div>

              <StatusBadge status={appointment.status} />
            </div>

            {/* Status controls */}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <StatusButton id={appointment.id} status="CONFIRMED" label="Confirm" />
              <StatusButton id={appointment.id} status="COMPLETED" label="Mark complete" />
              <StatusButton id={appointment.id} status="CANCELLED" label="Cancel" />
              <StatusButton id={appointment.id} status="PENDING" label="Reset to pending" />
            </div>
          </article>
        ))
      )}
    </div>
  );
}

/** Colour-coded status pill. */
function StatusBadge({ status }: { status: AppointmentStatus }) {
  // Typing the keys as AppointmentStatus means a typo like "CANCELED" is a
  // build error here, instead of a mystery grey badge in the browser.
  const colours: Record<AppointmentStatus, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-200 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${colours[status]}`}>
      {status}
    </span>
  );
}

/**
 * One button that submits its own small form. Each form carries the
 * appointment id and the new status as hidden fields.
 */
function StatusButton({
  id,
  status,
  label,
}: {
  id: string;
  status: AppointmentStatus;
  label: string;
}) {
  return (
    <form action={updateAppointmentStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primaryColor hover:text-primaryColor"
      >
        {label}
      </button>
    </form>
  );
}
