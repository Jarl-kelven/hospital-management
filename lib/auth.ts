// lib/auth.ts
import crypto from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "healthnet_session";

// 7 days session duration (you can change this later)
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function hashToken(token: string) {
  // Store only a hash in the DB (safer than storing raw session token)
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Creates a new session record + sets httpOnly cookie.
 */
export async function createSession(userId: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Returns the currently logged-in user (or null).
 *
 * Wrapped in React's `cache()`. Several things ask "who is logged in?" while
 * building a single page — the site header, the dashboard layout's guard, and
 * often the page itself. Without cache() that's three identical database
 * queries per request. With it, the first call does the work and the rest get
 * the same answer for free.
 *
 * The cache lasts for one request only, so it never serves one visitor's user
 * to another.
 */
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;

  // Session expired => remove the DB row and treat the user as logged out.
  //
  // NOTE: we deliberately do NOT delete the cookie here. getCurrentUser() is
  // meant to be called from Server Components, and Next.js throws
  // "Cookies can only be modified in a Server Action or Route Handler"
  // if you mutate cookies during render. The stale cookie is harmless once
  // the session row is gone, and logging out clears it properly.
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { tokenHash } }).catch(() => {});
    return null;
  }

  return session.user;
});

/**
 * Logs out the current user (deletes session + cookie).
 */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.delete({ where: { tokenHash } }).catch(() => {});
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Page guard: use at the top of any page or layout that requires a login.
 *
 *   const user = await requireUser();
 *
 * `redirect()` never returns, so after this line TypeScript knows `user`
 * is not null — no extra null checks needed.
 */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?error=Please%20login%20to%20continue");
  }

  return user;
}

/**
 * Page guard for admin-only pages. Non-admins are sent to their own
 * dashboard rather than the login page, since they *are* logged in.
 */
export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/dashboard?error=Admins%20only");
  }

  return user;
}