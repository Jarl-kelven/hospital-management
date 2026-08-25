// app/(auth)/signup/page.tsx
import Link from "next/link";
import { signupAction } from "../actions";

/**
 * Signup Page (Server Component)
 * - Later we’ll hash password with bcrypt and store user via Prisma.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="w-full max-w-xl mx-auto rounded-xl bg-white shadow-sm border border-gray-100 p-6">
      <h1 className="text-2xl font-bold text-gray-800">Create account</h1>

      {/* signupAction redirects to /signup?error=... — without this the user
          saw nothing happen on a failed signup. */}
      {params?.error && (
        <p className="mt-3 text-xs font-bold text-primaryColor">{params.error}</p>
      )}

      <p className="text-sm text-gray-700 mt-1">
        Already have an account?{" "}
        <Link href="/login" className="text-primaryColor font-bold">
          Login
        </Link>
      </p>

      <form action={signupAction} className="mt-6 space-y-4">
        {/* Full name */}
        <div>
          <label className="text-xs font-bold text-gray-800 block mb-2" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="John Doe"
            className="input-field"
          />
        </div>

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
            minLength={8}
            placeholder="At least 8 characters"
            className="input-field"
          />
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2 text-xs text-gray-700">
          <input id="terms" name="terms" type="checkbox" required className="mt-1" />
          <label htmlFor="terms">
            I agree to the{" "}
            <Link href="/services" className="text-primaryColor font-bold">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/contact" className="text-primaryColor font-bold">
              Privacy policy
            </Link>
            .
          </label>
        </div>

        <button type="submit" className="btn w-full">
          Sign up
        </button>
      </form>
    </main>
  );
}