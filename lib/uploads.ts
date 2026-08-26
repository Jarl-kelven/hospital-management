// lib/uploads.ts
import { del, put } from "@vercel/blob";
import crypto from "node:crypto";

/**
 * Saves an uploaded image to Vercel Blob and returns the public URL to store in
 * the database (e.g. "https://xyz.public.blob.vercel-storage.com/doctors/a1b2.png").
 *
 * This used to write into `public/uploads/` on local disk, which works with
 * `npm run dev` but not on Vercel — their filesystem is read-only and wiped
 * between requests, so an uploaded photo would 404 almost immediately.
 *
 * Blob storage is used in development too, rather than keeping the old disk code
 * as a second path. One code path means the thing you test is the thing that
 * runs in production.
 */

// Only allow real image types, so nobody can upload a .exe or a script.
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

// Everything we upload goes under this prefix. It's also how `deleteDoctorPhoto`
// recognises a file as ours before deleting it.
const FOLDER = "doctors";

export async function saveDoctorPhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Photo must be a PNG, JPEG or WebP image.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Photo must be smaller than 2MB.");
  }

  // Build our own filename instead of trusting the uploaded one. A name like
  // "../../evil.js" could otherwise escape the folder we meant to write to.
  // The extension comes from the MIME type, never from the uploaded filename.
  const extension =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const pathname = `${FOLDER}/${crypto.randomUUID()}.${extension}`;

  const blob = await put(pathname, file, {
    access: "public",

    // Off because we already generate a UUID. Left on, Blob would append its own
    // random string and the stored URL wouldn't match the name we built.
    addRandomSuffix: false,

    contentType: file.type,
  });

  // The absolute URL — this is what goes in the database.
  return blob.url;
}

/**
 * Deletes a photo we previously uploaded. Called when a doctor is removed, so we
 * don't slowly fill the store with images nobody points at any more.
 *
 * Two safety details, same as before:
 * - We only touch files under the `doctors/` prefix, so the seeded
 *   /images/doc1.png photos (which are part of the repo) are left alone.
 * - Failing to delete is not worth crashing over — the database row is already
 *   gone, which is the part that matters — so we just log it.
 */
export async function deleteDoctorPhoto(photoUrl: string): Promise<void> {
  if (!isUploadedPhoto(photoUrl)) return;

  try {
    await del(photoUrl);
  } catch (error) {
    console.error("[uploads] could not delete", photoUrl, error);
  }
}

/**
 * True only for absolute URLs under our own `doctors/` prefix.
 *
 * `new URL()` throws on a relative path, which is exactly what we want: the
 * seeded "/images/doc1.png" values land in the catch and return false, so they
 * can never be passed to del().
 */
function isUploadedPhoto(photoUrl: string): boolean {
  try {
    return new URL(photoUrl).pathname.startsWith(`/${FOLDER}/`);
  } catch {
    return false;
  }
}
