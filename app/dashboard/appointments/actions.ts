// app/dashboard/appointments/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

/**
 * Books a new appointment for the logged-in patient.
 */
export async function bookAppointmentAction(formData: FormData) {
  const user = await requireUser();

  const doctorId = String(formData.get("doctorId") ?? "");
  const scheduledAt = String(formData.get("scheduledAt") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!doctorId || !scheduledAt) {
    redirect("/dashboard/appointments?error=Pick%20a%20doctor%20and%20a%20time");
  }

  // An <input type="datetime-local"> gives us a string like
  // "2026-09-01T14:30", which the Date constructor understands.
  //
  // TIMEZONE NOTE: that string carries no timezone, so Node reads it as the
  // SERVER's local time. Locally that's your own clock, so everything lines up.
  // Once deployed the server usually runs on UTC, and since we also display
  // times with the server's clock, the patient still sees back exactly what
  // they picked — it's consistent. If you later need true timezone handling
  // (e.g. clinics in more than one country), send the browser's
  // `new Date().getTimezoneOffset()` along in a hidden input and apply it here.
  const when = new Date(scheduledAt);

  // Number.isNaN on the timestamp is how you check for an invalid date.
  if (Number.isNaN(when.getTime())) {
    redirect("/dashboard/appointments?error=That%20date%20looks%20wrong");
  }

  if (when < new Date()) {
    redirect("/dashboard/appointments?error=Pick%20a%20time%20in%20the%20future");
  }

  // Make sure the doctor still exists. If the admin deleted them while this
  // page was open, the create below would fail with a raw database error, so
  // we check first and show something readable. `select` keeps it cheap —
  // we only need to know whether a row came back.
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true },
  });

  if (!doctor) {
    redirect("/dashboard/appointments?error=That%20doctor%20is%20no%20longer%20available");
  }

  await prisma.appointment.create({
    data: {
      patientId: user.id,
      doctorId,
      scheduledAt: when,
      reason: reason === "" ? null : reason,
      // status defaults to PENDING in the schema — an admin confirms it.
    },
  });

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/admin/appointments");

  redirect("/dashboard/appointments?success=Appointment%20requested");
}

/**
 * Lets a patient cancel their own appointment.
 */
export async function cancelMyAppointmentAction(formData: FormData) {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/appointments?error=Missing%20appointment");

  // The `patientId` in the where clause is the important bit: it means this
  // only works on the logged-in user's own appointments. Without it, someone
  // could cancel a stranger's appointment by guessing an id.
  await prisma.appointment.updateMany({
    where: { id, patientId: user.id },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/admin/appointments");

  redirect("/dashboard/appointments?success=Appointment%20cancelled");
}
