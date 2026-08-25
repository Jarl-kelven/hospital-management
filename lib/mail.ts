// lib/mail.ts
import { Resend } from "resend";

/**
 * Sends the contact-form enquiry to the admin's inbox using Resend.
 *
 * Two environment variables are involved:
 * - RESEND_API_KEY  — from resend.com/api-keys
 * - CONTACT_FROM_EMAIL — optional. Defaults to Resend's shared test address,
 *   which can only deliver to the email you signed up with. Once you've
 *   verified your own domain in Resend, set this to something like
 *   "HealthNet <noreply@yourdomain.com>" and it can email anyone.
 *
 * The enquiry goes to ADMIN_EMAIL, the same variable the seed script uses.
 */

export type ContactEnquiry = {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
};

/**
 * Tries to send the enquiry.
 *
 * Returns true on success and false on any failure — it never throws. That's
 * deliberate: the contact form saves the message to the database first, so a
 * missing API key or a Resend outage shouldn't show the visitor an error page
 * for a message we've already safely stored.
 */
export async function sendContactEmail(enquiry: ContactEnquiry): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey || !adminEmail) {
    console.error("[mail] RESEND_API_KEY or ADMIN_EMAIL is missing — email not sent.");
    return false;
  }

  // Built here rather than at the top of the file so importing this module
  // never fails, even before you've added the key to .env.
  const resend = new Resend(apiKey);

  /*
    A subject line is a single header, so it can't contain line breaks. A
    browser text input can't produce one anyway — but a script posting directly
    to the server action can, and a newline in a header is how header-injection
    attacks work. One replace closes it.
  */
  const safeSubject = enquiry.subject.replace(/[\r\n]+/g, " ");

  try {
    const { error } = await resend.emails.send({
      /*
        "from" must be an address Resend is allowed to send as. The default
        below is Resend's shared sandbox sender, which works with no setup.

        `||` here, not `??`. They look interchangeable but aren't: `??` only
        falls back when the value is null or undefined, so an empty
        `CONTACT_FROM_EMAIL=` line in .env would pass "" straight through and
        every send would fail. `||` also catches the empty string.
      */
      from: process.env.CONTACT_FROM_EMAIL?.trim() || "HealthNet <onboarding@resend.dev>",
      to: adminEmail,

      // replyTo is the useful bit: hitting Reply in your mail client writes
      // back to the visitor instead of to the sandbox address.
      replyTo: enquiry.email,

      subject: `HealthNet enquiry: ${safeSubject}`,
      text: buildPlainTextBody(enquiry),
      html: buildHtmlBody(enquiry),
    });

    // Resend reports problems by returning an `error` object rather than
    // throwing, so we have to check for it explicitly.
    if (error) {
      console.error("[mail] Resend rejected the message:", error);
      return false;
    }

    return true;
  } catch (caught) {
    // This catches the network-level failures — no internet, DNS, timeouts.
    console.error("[mail] could not reach Resend:", caught);
    return false;
  }
}

/** A plain-text version, for mail clients that don't render HTML. */
function buildPlainTextBody(enquiry: ContactEnquiry) {
  return [
    `From: ${enquiry.name} <${enquiry.email}>`,
    `Phone: ${enquiry.phone ?? "not given"}`,
    `Subject: ${enquiry.subject}`,
    "",
    enquiry.message,
  ].join("\n");
}

/**
 * The HTML version. Note `escapeHtml` on every value: without it, a message
 * containing "<script>" would be injected straight into the email body.
 * Email clients mostly strip scripts, but escaping is the habit to keep.
 */
function buildHtmlBody(enquiry: ContactEnquiry) {
  return `
    <div style="font-family: system-ui, sans-serif; color: #1f2937; line-height: 1.6;">
      <h2 style="color: #c80040; margin: 0 0 16px;">New enquiry from the website</h2>
      <p style="margin: 0 0 4px;"><strong>Name:</strong> ${escapeHtml(enquiry.name)}</p>
      <p style="margin: 0 0 4px;"><strong>Email:</strong> ${escapeHtml(enquiry.email)}</p>
      <p style="margin: 0 0 4px;"><strong>Phone:</strong> ${escapeHtml(enquiry.phone ?? "not given")}</p>
      <p style="margin: 0 0 16px;"><strong>Subject:</strong> ${escapeHtml(enquiry.subject)}</p>
      <div style="border-left: 3px solid #ff85ab; padding-left: 16px; white-space: pre-wrap;">${escapeHtml(enquiry.message)}</div>
    </div>
  `;
}

/** Turns characters that mean something in HTML into their safe equivalents. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
