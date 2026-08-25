// app/admin/appointments/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/** The four values allowed by the AppointmentStatus enum in the schema. */
const VALID_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;

type Status = (typeof VALID_STATUSES)[number];

/**
 * Changes an appointment's status (confirm, complete or cancel).
 *
 * The status arrives as a string from the form, so we check it against the
 * list above before trusting it — otherwise someone could post any value.
 */
export async function updateAppointmentStatusAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !VALID_STATUSES.includes(status as Status)) {
    redirect("/admin/appointments?error=Invalid%20request");
  }

  /*
    updateMany rather than update, for the same reason as everywhere else in
    this app: `update` throws if the row has gone (Prisma error P2025), and an
    uncaught throw inside a server action becomes a 500 error page. `updateMany`
    just reports how many rows it changed, so a stale button — the admin has the
    list open while the account gets deleted — turns into a clear message
    instead of a crash.
  */
  const result = await prisma.appointment.updateMany({
    where: { id },
    data: { status: status as Status },
  });

  if (result.count === 0) {
    redirect("/admin/appointments?error=That%20appointment%20no%20longer%20exists");
  }

  revalidatePath("/admin/appointments");
  revalidatePath("/dashboard/appointments");

  redirect("/admin/appointments?success=Appointment%20updated");
}
