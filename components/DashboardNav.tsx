// components/DashboardNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The tab bar shared by both dashboards — admin and patient.
 *
 * This is a Client Component for exactly one reason: `usePathname()` only
 * exists in the browser. The layouts that render it stay Server Components, so
 * requireAdmin() / requireUser() still run on the server before any of this
 * reaches the page. Only the tab bar ships to the browser, not the whole layout.
 *
 * The links are passed in as a prop, so one file serves both dashboards instead
 * of two near-identical copies drifting apart over time.
 */

export type NavLink = {
  href: string;
  label: string;
  /**
   * Set this on a section's landing page — "/admin" and "/dashboard".
   *
   * Without it those two would look active everywhere, because "/admin" is the
   * start of every admin URL: visit /admin/doctors and Overview would light up
   * as well, so the highlight proves nothing.
   *
   * Sub-pages don't need it, and shouldn't have it — "/admin/doctors" staying
   * highlighted on a deeper URL like "/admin/doctors/5" is what we want.
   */
  exact?: boolean;
};

/** Keyboard-only focus ring, same as the site header uses. */
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaryColor";

export default function DashboardNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  /** True when this link points at the page we're currently on. */
  const isActive = ({ href, exact }: NavLink) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="mx-auto mt-4 flex w-11/12 gap-1 overflow-x-auto pb-3 text-sm">
      {links.map((link) => {
        const active = isActive(link);

        return (
          <Link
            key={link.href}
            href={link.href}
            /*
              The pink pill says "you are here" to anyone looking at the screen.
              aria-current says the same thing to a screen reader, which can't
              see a background colour.
            */
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 whitespace-nowrap transition-colors ${focusRing} ${
              active
                ? "bg-primaryColor/10 font-bold text-primaryColor"
                : "font-semibold text-gray-700 hover:bg-black/5 hover:text-primaryColor"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
