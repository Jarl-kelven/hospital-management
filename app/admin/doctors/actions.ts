// app/admin/doctors/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { deleteDoctorPhoto, saveDoctorPhoto } from "@/lib/uploads";

/**
 * Server actions for managing doctors.
 *
 * Every action calls requireAdmin() first. The admin layout already blocks
 * non-admins from SEEING these pages, but a server action is a real HTTP
 * endpoint that someone could call directly — so it needs its own check.
 */

/** Small helper: reads a text field from the form and trims the whitespace. */
function text(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

/**
 * Reads a number from the form. Returns 0 for blank fields so the admin can
 * leave ratings empty on a brand-new doctor.
 */
function number(formData: FormData, field: string) {
  const value = Number(formData.get(field));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Same as number(), but rounds to a whole number.
 *
 * totalRating and totalPatients are `Int` in the schema, so a decimal would
 * make Prisma throw. The browser's number input already blocks decimals, but
 * anyone can send a raw POST request, so we clean the value here too.
 */
function wholeNumber(formData: FormData, field: string) {
  return Math.round(number(formData, field));
}

/**
 * Clears the cached copies of every page that lists doctors, so a change here
 * appears on the public site immediately.
 *
 * The "/doctors/[id]" call needs the second argument, "page", because that
 * route is dynamic — one path pattern covering many URLs. Without it Next.js
 * would look for a literal page at the path "/doctors/[id]".
 */
function refreshDoctorPages() {
  revalidatePath("/admin/doctors");
  revalidatePath("/doctors");
  revalidatePath("/doctors/[id]", "page");
  revalidatePath("/home");
}

export async function createDoctorAction(formData: FormData) {
  await requireAdmin();

  const name = text(formData, "name");
  const specialization = text(formData, "specialization");
  const hospital = text(formData, "hospital");
  const photo = formData.get("photo");

  if (!name || !specialization || !hospital) {
    redirect("/admin/doctors?error=Name,%20specialization%20and%20hospital%20are%20required");
  }

  // `formData.get()` on a file input gives us a File object. An empty file
  // input still returns a File, but with a size of 0 — hence both checks.
  if (!(photo instanceof File) || photo.size === 0) {
    redirect("/admin/doctors?error=Please%20choose%20a%20photo");
  }

  // Start with an empty string so TypeScript knows this always has a value.
  let photoUrl = "";

  // saveDoctorPhoto throws for wrong file types or oversized images, so we
  // catch that and show the message instead of crashing the page.
  // Note: the redirect() goes in the catch block, never inside the try —
  // redirect works by throwing, so a try block would swallow it.
  try {
    photoUrl = await saveDoctorPhoto(photo);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    redirect(`/admin/doctors?error=${encodeURIComponent(message)}`);
  }

  await prisma.doctor.create({
    data: {
      name,
      specialization,
      hospital,
      photoUrl,
      avgRating: number(formData, "avgRating"),
      totalRating: wholeNumber(formData, "totalRating"),
      totalPatients: wholeNumber(formData, "totalPatients"),
    },
  });

  // Tell Next.js the doctor pages are out of date so the change shows up
  // straight away instead of serving a cached version.
  refreshDoctorPages();

  redirect("/admin/doctors?success=Doctor%20added");
}

export async function deleteDoctorAction(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  if (!id) redirect("/admin/doctors?error=Missing%20doctor%20id");

  // Look the doctor up first, for two reasons: we need their photo path to
  // tidy up the image file, and prisma.delete() throws a raw error if the id
  // doesn't exist (say, two admins clicking Remove at the same time).
  const doctor = await prisma.doctor.findUnique({ where: { id } });

  if (!doctor) {
    redirect("/admin/doctors?error=That%20doctor%20has%20already%20been%20removed");
  }

  // Deleting a doctor also deletes their appointments, because the schema
  // sets `onDelete: Cascade` on that relation.
  await prisma.doctor.delete({ where: { id } });

  // Now clean up the image file that row was pointing at.
  await deleteDoctorPhoto(doctor.photoUrl);

  refreshDoctorPages();

  redirect("/admin/doctors?success=Doctor%20removed");
}
