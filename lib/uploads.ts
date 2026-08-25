// lib/uploads.ts
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Saves an uploaded image into the `public/` folder and returns the URL path
 * to store in the database (e.g. "/uploads/doctors/a1b2c3.png").
 *
 * HEADS UP — this writes to the local disk, which works when you run
 * `npm run dev` or a normal Node server, but NOT on Vercel: their filesystem
 * is read-only and wiped between requests. When you deploy, swap the two
 * `writeFile` lines below for Vercel Blob or Cloudinary — the rest of the
 * app only ever sees the returned string, so nothing else has to change.
 */

// Only allow real image types, so nobody can upload a .exe or a script.
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function saveDoctorPhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Photo must be a PNG, JPEG or WebP image.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Photo must be smaller than 2MB.");
  }

  // Build our own filename instead of trusting the uploaded one. A name like
  // "../../evil.js" could otherwise escape the uploads folder.
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${crypto.randomUUID()}.${extension}`;

  // public/uploads/doctors/ — created on first upload if it doesn't exist.
  const folder = path.join(process.cwd(), "public", "uploads", "doctors");
  await mkdir(folder, { recursive: true });

  // A File from a form is a stream, so we read it into a Buffer to write it.
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(folder, filename), bytes);

  // Anything inside public/ is served from the site root, so drop the "public".
  return `/uploads/doctors/${filename}`;
}

/**
 * Deletes a photo we previously saved. Called when a doctor is removed, so we
 * don't slowly fill up the disk with images nobody points at any more.
 *
 * Two safety details:
 * - We only touch files under /uploads/doctors/, so the seeded /images/doc1.png
 *   photos (which are part of the repo) are left alone.
 * - Failing to delete a file is not worth crashing over — the database row is
 *   already gone, which is the part that matters — so we just log it.
 */
export async function deleteDoctorPhoto(photoUrl: string): Promise<void> {
  const prefix = "/uploads/doctors/";
  if (!photoUrl.startsWith(prefix)) return;

  // basename() strips any directory tricks, so we can only ever delete a file
  // inside the uploads folder.
  const filename = path.basename(photoUrl);

  try {
    await unlink(path.join(process.cwd(), "public", "uploads", "doctors", filename));
  } catch (error) {
    console.error("[uploads] could not delete", filename, error);
  }
}
