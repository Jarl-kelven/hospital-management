// app/dashboard/layout.tsx
import type { ReactNode } from "react";
import DashboardNav, { type NavLink } from "@/components/DashboardNav";
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

  /*
    `exact` on "My details" only, because "/dashboard" is the start of every URL
    in here — without it, it would stay highlighted on Edit profile as well.
  */
  const links: NavLink[] = [
    { href: "/dashboard", label: "My details", exact: true },
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

        {/*
          Same tab bar the admin area uses — one Client Component, two dashboards.
          It's a Client Component so it can read the current path; this layout
          stays on the server, where requireUser() belongs.
        */}
        <DashboardNav links={links} />
      </div>

      <main className="mx-auto w-11/12 py-8">{children}</main>
    </div>
  );
}
