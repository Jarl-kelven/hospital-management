// components/Header.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";

/**
 * The site header.
 *
 * This is a Client Component because it needs three browser-only things:
 * the scroll position, the open/closed state of the mobile menu, and the
 * current pathname for highlighting the active link.
 *
 * It does NOT read the database. The logged-in user is passed down as a prop
 * from app/layout.tsx, which is a Server Component and can read the session
 * cookie safely.
 */

/**
 * Just the parts of the user we actually display. Keeping this narrow means we
 * never accidentally send the password hash to the browser.
 */
export type HeaderUser = {
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

const navLinks = [
  { path: "/home", display: "Home" },
  { path: "/doctors", display: "Find a Doctor" },
  { path: "/services", display: "Services" },
  { path: "/contact", display: "Contact" },
];

/**
 * Keyboard focus styling, written once and reused.
 *
 * `focus-visible` only shows the ring for keyboard users, not on mouse clicks —
 * which is why it's the right choice over plain `focus`.
 */
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaryColor";

/** The screen width at which we switch to the desktop layout (Tailwind's `lg`). */
const DESKTOP_WIDTH = "(min-width: 64rem)";

export default function Header({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();

  // Has the page been scrolled? We use this only to add a shadow and a border,
  // never to change the header's height — that was the old bug that made the
  // bar grow and the text jump as you scrolled.
  const [scrolled, setScrolled] = useState(false);

  // Is the mobile menu open? This lives in React state instead of toggling a
  // CSS class by hand. That matters: the old version added a `.show` class to
  // the DOM and left it there, so the menu reappeared on its own whenever the
  // window was resized down to mobile.
  const [menuOpen, setMenuOpen] = useState(false);

  // A handle on the hamburger button so we can put focus back on it after the
  // menu closes. Without this, a keyboard user who presses Escape loses their
  // place on the page entirely.
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Admins get sent to their own area; everyone else to the patient dashboard.
  const dashboardHref = user?.role === "ADMIN" ? "/admin" : "/dashboard";

  /** Closes the menu and hands focus back to the button that opened it. */
  const closeAndRefocus = () => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);

    onScroll(); // run once, in case the page loads already scrolled down
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu whenever the route changes, so tapping a link doesn't leave
  // the panel hanging open over the new page.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    // Escape closes the menu — expected behaviour for anything overlay-like.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAndRefocus();
    };

    /*
      Belt and braces for the resize bug: the panel is `lg:hidden` so it can
      never show on a wide screen, but we also close it when the screen grows
      past the desktop breakpoint so it isn't waiting there when you come back
      down to a narrow one.

      This watches a media query rather than the plain `resize` event on
      purpose. On phones, `resize` fires when the address bar collapses or the
      on-screen keyboard appears — which would close the menu by itself for no
      reason. A media query only fires when the answer to the question
      "are we on a desktop-sized screen?" actually changes.
    */
    const desktop = window.matchMedia(DESKTOP_WIDTH);
    const onBreakpointChange = () => setMenuOpen(false);

    // Stop the page behind the menu from scrolling while it's open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpointChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpointChange);
    };
  }, [menuOpen]);

  /** True when the given path is the page we're on (or a page inside it). */
  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    /*
      The header and the mobile menu are siblings, not parent and child.

      That's not a style choice — it's required. `backdrop-blur` on the header
      makes it a "containing block", which means any `position: fixed` element
      inside it is positioned against the header (64px tall) instead of against
      the window. A fixed overlay nested in there would collapse to nothing.
    */
    <>
      <header
        className={`sticky top-0 z-50 h-16 bg-linear-to-r from-primaryLight via-white/85 to-emerald-50/70 backdrop-blur-md transition-[box-shadow,border-color] duration-200 ${
          scrolled ? "border-b border-black/5 shadow-sm" : "border-b border-transparent"
        }`}
      >
        {/*
          h-16 on the header AND h-full here. The height is fixed and identical
          whether or not the page is scrolled, which is what keeps the bar from
          resizing under you.
        */}
        <div className="mx-auto flex h-full w-11/12 items-center justify-between gap-4">
          <Link
            href="/home"
            aria-label="HealthNet home"
            className={`shrink-0 rounded-lg ${focusRing}`}
          >
            {/*
              `h-auto` matters here. width/height on next/image are the real
              pixel size of the file; the moment CSS changes only the width, the
              image is squashed. h-auto lets the height follow along.
            */}
            <Image
              src="/images/Health_logo.png"
              alt="HealthNet"
              width={144}
              height={48}
              className="h-auto w-32 sm:w-36"
              priority
            />
          </Link>

          {/* ---------- Desktop navigation ---------- */}
          <nav className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className={`rounded-full px-4 py-2 text-sm transition-colors ${focusRing} ${
                      isActive(link.path)
                        ? "bg-primaryColor/10 font-bold text-primaryColor"
                        : "text-gray-700 hover:bg-black/5 hover:text-primaryColor"
                    }`}
                  >
                    {/*
                      Note the hover only changes colour and background, never
                      the font weight. Bolding text on hover changes how wide it
                      is, which nudges every link next to it — a small but
                      annoying wobble the old header had.
                    */}
                    {link.display}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ---------- Desktop account area ---------- */}
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  className={`flex items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-black/5 ${focusRing}`}
                  title={user.email}
                >
                  <Avatar name={user.name} />
                  <span className="max-w-[10rem] truncate text-sm font-semibold text-gray-800">
                    {user.name}
                  </span>
                </Link>

                {/*
                  Logging out changes data on the server, so it has to be a form
                  posting to a server action — not a link. Links are for going
                  places; forms are for changing things.
                */}
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className={`rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-primaryColor hover:text-primaryColor ${focusRing}`}
                  >
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-primaryColor ${focusRing}`}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className={`rounded-full bg-primaryColor px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* ---------- Mobile menu button ---------- */}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`relative h-10 w-10 shrink-0 rounded-full transition-colors hover:bg-black/5 lg:hidden ${focusRing}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {/*
              Two absolutely-positioned bars that rotate into an X. Because both
              sit in the middle and move with transforms, the button never
              changes size and nothing around it shifts.

              `transition-all` rather than `transition-transform`, because these
              animate `top` as well as `rotate` — and transition-transform would
              leave the `top` change to snap instantly.
            */}
            <span
              className={`absolute left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-gray-800 transition-all duration-300 ${
                menuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[15px]"
              }`}
            />
            <span
              className={`absolute left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-gray-800 transition-all duration-300 ${
                menuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-[23px]"
              }`}
            />
          </button>
        </div>
      </header>

      {/* ---------- Mobile menu ---------- */}
      {/*
        A panel that drops down from under the header, rather than a drawer
        sliding in from the side. `lg:hidden` guarantees it can't appear on a
        desktop screen no matter what the state says.

        It stays mounted and animates with opacity + translate, so it can fade
        out on close instead of vanishing. Two things switch off while it's
        closed:
        - `pointer-events-none`, so the invisible panel doesn't swallow taps.
        - `inert`, which takes everything inside it out of the tab order and
          hides it from screen readers. Invisible is not the same as gone: an
          opacity-0 button is still tabbable, so without this a keyboard user
          could tab into the hidden menu and hit "Log out" by accident.

        z-40 puts it under the header (z-50) so it appears to slide out from
        behind the bar.
      */}
      <div
        id="mobile-menu"
        inert={!menuOpen}
        className={`fixed inset-x-0 top-16 z-40 h-[calc(100dvh-4rem)] lg:hidden ${
          menuOpen ? "" : "pointer-events-none"
        }`}
      >
        {/* Tapping the dimmed area closes the menu. */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={closeAndRefocus}
          className={`absolute inset-0 h-full w-full cursor-default bg-gray-900/30 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute inset-x-0 top-0 origin-top rounded-b-3xl bg-white px-6 pt-4 pb-7 shadow-xl transition-all duration-300 ease-out ${
            menuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          }`}
        >
          <nav>
            <ul className="flex flex-col">
              {navLinks.map((link, index) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    onClick={() => setMenuOpen(false)}
                    /*
                      Each link fades in slightly after the one above it. The
                      delay is set inline because the value changes per item,
                      and Tailwind can only generate classes it can see in the
                      source — it can't build `delay-[${index * 50}ms]`.
                    */
                    style={{ transitionDelay: menuOpen ? `${index * 45 + 60}ms` : "0ms" }}
                    className={`flex items-center justify-between border-b border-gray-100 py-4 text-lg transition-all duration-300 ${focusRing} ${
                      menuOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                    } ${
                      isActive(link.path)
                        ? "font-bold text-primaryColor"
                        : "font-semibold text-gray-800"
                    }`}
                  >
                    {link.display}
                    {isActive(link.path) && (
                      <span className="h-2 w-2 rounded-full bg-primaryColor" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-6">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={dashboardHref}
                  onClick={() => setMenuOpen(false)}
                  className={`flex min-w-0 items-center gap-3 rounded-lg ${focusRing}`}
                >
                  <Avatar name={user.name} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-gray-800">
                      {user.name}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {user.email}
                    </span>
                  </span>
                </Link>

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className={`shrink-0 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 ${focusRing}`}
                  >
                    Log out
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-full border border-gray-300 py-3 text-center text-sm font-bold text-gray-800 ${focusRing}`}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-full bg-primaryColor py-3 text-center text-sm font-bold text-white ${focusRing}`}
                >
                  Create an account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/** A small circle showing the first letter of someone's name. */
function Avatar({ name }: { name: string }) {
  // `[0]` on an empty string is undefined, so fall back to "?" to be safe.
  const initial = (name.trim()[0] ?? "?").toUpperCase();

  return (
    <span
      aria-hidden="true"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primaryColor text-sm font-bold text-white"
    >
      {initial}
    </span>
  );
}
