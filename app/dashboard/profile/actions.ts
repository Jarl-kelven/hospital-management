// app/dashboard/profile/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

/** Reads a text field, returning null when it's blank. */
function optionalText(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? "").trim();
  return value === "" ? null : value;
}

/** The values the Gender enum accepts in the database. */
const GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;
type Gender = (typeof GENDERS)[number];

export async function saveProfileAction(formData: FormData) {
  // Gives us the logged-in user, or redirects to /login. It also means a
  // patient can only ever edit their OWN profile — the user id comes from
  // their session cookie, never from the form.
  const user = await requireUser();

  const genderValue = String(formData.get("gender") ?? "");
  const dateOfBirthValue = optionalText(formData, "dateOfBirth");

  // A blank date input gives "", which we store as null.
  const dateOfBirth = dateOfBirthValue ? new Date(dateOfBirthValue) : null;

  // new Date("banana") doesn't throw — it returns an "Invalid Date", which
  // Prisma then rejects with an ugly 500. Catching it here lets us show a
  // friendly message instead. getTime() is NaN only for invalid dates.
  if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) {
    redirect("/dashboard/profile?error=That%20date%20of%20birth%20looks%20wrong");
  }

  const data = {
    dateOfBirth,
    // Only save the gender if it's one of the allowed enum values.
    gender: GENDERS.includes(genderValue as Gender) ? (genderValue as Gender) : null,
    phone: optionalText(formData, "phone"),
    address: optionalText(formData, "address"),
    emergencyName: optionalText(formData, "emergencyName"),
    emergencyPhone: optionalText(formData, "emergencyPhone"),
    bloodGroup: optionalText(formData, "bloodGroup"),
    allergies: optionalText(formData, "allergies"),
    notes: optionalText(formData, "notes"),
  };

  // `upsert` = update the row if this user already has a profile, otherwise
  // create it. Saves us checking whether one exists first.
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");

  redirect("/dashboard?success=Profile%20saved");
}
