// app/admin/layout.tsx
import type { ReactNode } from "react";
import DashboardNav, { type NavLink } from "@/components/DashboardNav";
import { requireAdmin } from "@/lib/auth";

/**
 * Admin layout.
 *
 * Because this is a layout, the `requireAdmin()` check below runs for EVERY
 * page inside app/admin/. That means we only write the security check once
 * instead of repeating it on each page.
 *
 * There's no log-out button here any more — the site header at the top of every
 * page has one, and two of them side by side was just confusing.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  /*
    `exact` on Overview only. Every admin URL starts with "/admin", so without it
    Overview would look active on the Doctors page too — see DashboardNav.
  */
  const links: NavLink[] = [
    { href: "/admin", label: "Overview", exact: true },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/doctors", label: "Doctors" },
    { href: "/admin/appointments", label: "Appointments" },
    { href: "/admin/messages", label: "Messages" },
  ];

  return (
    /*
      The height is 100vh minus the 4rem site header, not a plain full screen
      height. The header sits above this, so a full-height box underneath it adds
      up to 4rem more than the window — giving every admin page a pointless
      little scroll.
    */
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      {/*
        Note we use `mx-auto w-11/12` here rather than the `.container` class.
        `.container` includes `my-14`, which is right for marketing pages but
        left a big empty gap inside this bar.
      */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto w-11/12 pt-6">
          <h1 className="text-xl font-bold text-gray-800">Admin dashboard</h1>
          <p className="text-xs text-gray-600">Signed in as {admin.email}</p>
        </div>

        {/*
          The tabs live in their own Client Component because highlighting the
          current one needs usePathname(), which is browser-only. This layout
          stays a Server Component so requireAdmin() above still runs first.
        */}
        <DashboardNav links={links} />
      </div>

      <main className="mx-auto w-11/12 py-8">{children}</main>
    </div>
  );
}
