// app/(auth)/actions.ts
"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { createSession, destroySession } from "../../lib/auth";

/**
 * Signup: creates only USER accounts (admins are promoted manually by you).
 */
export async function signupAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    redirect("/signup?error=Missing%20fields");
  }

  if (password.length < 8) {
    redirect("/signup?error=Password%20must%20be%20at%20least%208%20characters");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/signup?error=Email%20already%20in%20use");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "USER", // enforced
    },
  });

  redirect("/login?success=Account%20created.%20Please%20login");
}

/**
 * Login: verifies credentials and creates a session cookie.
 */
export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Missing%20email%20or%20password");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Generic error message for security (don’t reveal if email exists)
  if (!user) {
    redirect("/login?error=Invalid%20credentials");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    redirect("/login?error=Invalid%20credentials");
  }

  // Optional: clear old sessions for this user (keeps it simple)
  await prisma.session.deleteMany({ where: { userId: user.id } });

  await createSession(user.id);

  // Send admins to the admin area and everyone else to their own dashboard.
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}

/**
 * Logout action (use it from a logout button later)
 */
export async function logoutAction() {
  await destroySession();
  redirect("/login?success=Logged%20out");
}