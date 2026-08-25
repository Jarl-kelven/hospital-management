// app/dashboard/layout.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";

/**
 * Patient dashboard layout.
 *
 * requireUser() runs for every page in app/dashboard/, so a logged-out
 * visitor is bounced to /login before any of this renders.
 *
 * The log-out button lives in the site header now, so it isn't repeated here.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const links = [
    { href: "/dashboard", label: "My details" },
    { href: "/dashboard/profile", label: "Edit profile" },
    { href: "/dashboard/appointments", label: "Appointments" },
    { href: "/doctors", label: "Find a doctor" },
  ];

  return (
    // 100vh minus the 4rem site header, so the page doesn't overflow the window
    // by exactly the height of the header.
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* `mx-auto w-11/12` instead of `.container`, which carries a my-14 margin. */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto w-11/12 pt-6">
          <h1 className="text-xl font-bold text-gray-800">Hi, {user.name}</h1>
          <p className="text-xs text-gray-600">{user.email}</p>
        </div>

        <nav className="mx-auto mt-4 flex w-11/12 gap-6 overflow-x-auto pb-3 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap font-semibold text-gray-700 hover:text-primaryColor"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="mx-auto w-11/12 py-8">{children}</main>
    </div>
  );
}
