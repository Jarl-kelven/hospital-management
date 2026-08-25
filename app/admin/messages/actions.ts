// app/admin/messages/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/**
 * Actions for the admin message inbox.
 *
 * requireAdmin() runs first in both. The layout already keeps non-admins off
 * the page, but a server action is a real HTTP endpoint someone could post to
 * directly, so it needs its own check.
 */

function refreshInbox() {
  revalidatePath("/admin/messages");
  revalidatePath("/admin"); // the overview shows the unread count
}

/** Reads a field and trims the whitespace off both ends. */
function text(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

/** Marks one message read or unread. */
export async function setMessageReadAction(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  if (!id) redirect("/admin/messages?error=Missing%20message%20id");

  // Hidden inputs always arrive as strings, so "true" is compared as text.
  const isRead = text(formData, "isRead") === "true";

  // updateMany rather than update: it simply affects zero rows if the id is
  // gone, instead of throwing. Nothing here depends on the row existing.
  await prisma.contactMessage.updateMany({ where: { id }, data: { isRead } });

  refreshInbox();
  redirect("/admin/messages");
}

/** Deletes a message for good. */
export async function deleteMessageAction(formData: FormData) {
  await requireAdmin();

  const id = text(formData, "id");
  if (!id) redirect("/admin/messages?error=Missing%20message%20id");

  await prisma.contactMessage.deleteMany({ where: { id } });

  refreshInbox();
  redirect("/admin/messages?success=Message%20deleted");
}
