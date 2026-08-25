/* src/components/Header.tsx */
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

/**
 * NOTE (Next.js):
 * - Put your images in: /public/images/...
 *   Example: /public/images/Health_logo.png
 * - Make sure your existing CSS class `.sticky-header` still exists
 *   (e.g. in app/globals.css) because we keep the same className.
 */

type NavItem = {
  path: string;
  display: string;
};

const navLinks: NavItem[] = [
  { path: "/home", display: "Home" },
  { path: "/doctors", display: "Find a Doctor" },
  { path: "/services", display: "Services" },
  { path: "/contact", display: "Contact" },
];

export default function Header() {
  const pathname = usePathname();

  // Header DOM node (for sticky-header class toggling)
  const headerRef = useRef<HTMLElement | null>(null);

  // Nav DOM node (for mobile menu show/hide)
  const menuRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    /**
     * Sticky header handler:
     * Adds/removes `.sticky-header` when the user scrolls.
     */
    const onScroll = () => {
      const headerEl = headerRef.current;
      if (!headerEl) return;

      const scrolled = window.scrollY > 80;
      headerEl.classList.toggle("sticky-header", scrolled);
    };

    // Run once on mount (helps if page loads mid-scroll)
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    // Cleanup to avoid memory leaks when component unmounts
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggler = () => {
    /**
     * Mobile menu toggler:
     * Toggles `.show` on the nav container.
     * Ensure your CSS defines what `.show` does (as in your current app).
     */
    const navEl = menuRef.current;
    if (!navEl) return;
    navEl.classList.toggle("show");
  };

  return (
    <header
      ref={headerRef}
      className="bg-gradient-to-r from-primaryLight from-1% via-white via-12% to-emerald-50 to-1%"
    >
      <section className="header section w-11/12 flex justify-between mx-auto items-center h-16">
        {/* Logo */}
        <div>
          <Image
            className="w-36"
            src="/images/Health_logo.png"
            alt="Hospital logo"
            width={144}
            height={48}
            priority
          />
        </div>

        {/* Navigation */}
        <nav ref={menuRef} className="navigation" onClick={toggler}>
          <ul className="flex justify-center items-center flex-row gap-1 text-gray-800">
            {navLinks.map((link) => {
              // Simple "active" logic similar to React Router's NavLink
              const isActive =
                pathname === link.path ||
                (link.path !== "/" && pathname?.startsWith(link.path + "/"));

              return (
                <li
                  className="lg:p-0 p-5 lg:mx-8 hover:font-semibold"
                  key={link.path}
                >
                  <Link
                    href={link.path}
                    className={isActive ? "text-primaryColor font-bold" : "text-gray-800"}
                  >
                    {link.display}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right side actions */}
        <div className="flex basis-28 justify-evenly items-center">
          {/* Hidden for now to retain your current styling/behavior */}
          <Image
            className="hidden"
            src="/images/avatar-icon.png"
            alt="User profile"
            width={32}
            height={32}
          />

          <Link href="/login">
            <button className="btn" type="button">
              Login
            </button>
          </Link>

          {/* Hamburger (mobile menu) */}
          <button
            type="button"
            onClick={toggler}
            className="hamburger ml-3 text-2xl text-primaryColor font-bold cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            &equiv;
          </button>
        </div>
      </section>
    </header>
  );
}