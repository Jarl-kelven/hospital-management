// app/contact/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendContactEmail } from "@/lib/mail";

/** Reads a field and trims the whitespace off both ends. */
function text(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

/**
 * A rough check that something looks like an email address: some characters,
 * an @, some more, a dot, then a couple more.
 *
 * Deliberately loose. There's no regex that correctly matches every valid
 * address, and being strict here mostly rejects real people. Catching obvious
 * typos is all we're after.
 */
function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export async function sendContactMessageAction(formData: FormData) {
  const name = text(formData, "name");
  const email = text(formData, "email");
  const phone = text(formData, "phone");
  const subject = text(formData, "subject");
  const message = text(formData, "message");

  /*
    --- The honeypot ---
    The form has a field called "website" that's hidden from view. A real person
    never sees it, so they never fill it in. Spam bots fill in every field they
    find, so anything arriving with a value here is almost certainly automated.

    We pretend it worked rather than showing an error. If a bot is told it
    failed, it retries with a different approach; if it's told it succeeded, it
    moves on. Nothing is saved and no email is sent.
  */
  if (text(formData, "website") !== "") {
    redirect("/contact?success=Thanks!%20We%27ve%20got%20your%20message%20and%20will%20be%20in%20touch");
  }

  // --- Validation ---
  // Each check redirects back with a message in the URL, which is the same
  // pattern the login and signup forms use.
  if (!name || !email || !subject || !message) {
    redirect("/contact?error=Please%20fill%20in%20your%20name,%20email,%20subject%20and%20message");
  }

  if (!looksLikeEmail(email)) {
    redirect("/contact?error=That%20email%20address%20doesn%27t%20look%20right");
  }

  if (message.length < 10) {
    redirect("/contact?error=Please%20write%20a%20little%20more%20so%20we%20can%20help");
  }

  /*
    Caps on length, checked on the server.

    The `maxLength` attributes on the inputs are a courtesy to real visitors —
    they stop the typing, they don't stop the request. Anyone can post straight
    to this action with no browser involved, so without these checks a single
    request could write megabytes into one database row. Never trust a limit
    that only exists in the browser.
  */
  if (
    name.length > 100 ||
    email.length > 200 ||
    phone.length > 40 ||
    subject.length > 150 ||
    message.length > 2000
  ) {
    redirect("/contact?error=One%20of%20those%20fields%20is%20too%20long.%20Please%20shorten%20it");
  }

  const enquiry = {
    name,
    email: email.toLowerCase(),
    phone: phone === "" ? null : phone,
    subject,
    message,
  };

  // --- Save first, then send ---
  // Order matters. Writing to the database first means the enquiry is never
  // lost, even if the email fails to go out.
  const saved = await prisma.contactMessage.create({ data: enquiry });

  // sendContactEmail never throws — it returns false and logs the reason — so
  // a missing API key can't turn into an error page for someone who has already
  // had their message safely stored.
  const emailSent = await sendContactEmail(enquiry);

  // Record whether it worked, so a broken API key is visible in the admin inbox
  // instead of failing silently.
  if (emailSent) {
    await prisma.contactMessage.update({
      where: { id: saved.id },
      data: { emailSent: true },
    });
  }

  // Refresh the admin inbox so the new message and unread count appear.
  revalidatePath("/admin/messages");
  revalidatePath("/admin");

  redirect("/contact?success=Thanks!%20We%27ve%20got%20your%20message%20and%20will%20be%20in%20touch");
}
