// app/(auth)/login/page.tsx
import Image from "next/image";
import Link from "next/link";
import { loginAction } from "../actions";

/**
 * Login Page (Server Component)
 * - Uses a Server Action for form submission
 * - Styled using your existing `.input-field` and `.btn` classes
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  // In Next.js 15+ searchParams is a Promise and must be awaited.
  const params = await searchParams;

  return (
    <main className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      {/* Left side (image/branding) */}
      <section className="hidden lg:block">
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-6">
          <h1 className="text-3xl font-bold text-gray-800">Welcome back</h1>
          <p className="text-sm text-gray-700 mt-2">
            Sign in to manage your appointments and update your profile.
          </p>

          <div className="mt-6">
            {/* Reuse an existing image you already have in /public/images */}
            <Image
              src="/images/hero-doc.png"
              alt="Hospital illustration"
              width={700}
              height={700}
              className="rounded-lg w-full h-auto"
              priority
            />
          </div>
        </div>
      </section>

      {/* Right side (form) */}
      <section className="rounded-xl bg-white shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800">Login</h2>

        {params?.error && (
          <p className="mt-3 text-xs font-bold text-primaryColor">{params.error}</p>
        )}
        {params?.success && (
          <p className="mt-3 text-xs font-bold text-green-700">{params.success}</p>
        )}

        <p className="text-sm text-gray-700 mt-1">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-primaryColor font-bold">
            Sign up
          </Link>
        </p>

        {/* Server Action form */}
        <form action={loginAction} className="mt-6 space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs font-bold text-gray-800 block mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="input-field"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-gray-800 block mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Your password"
              className="input-field"
            />
          </div>

          {/* Submit */}
          <button type="submit" className="btn w-full">
            Sign in
          </button>

          {/* Extra links */}
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span>Protected access</span>

            {/* We'll add /forgot-password later if you want */}
            <Link href="/contact" className="text-primaryColor font-bold">
              Need help?
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}