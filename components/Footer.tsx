// components/Footer.tsx
import Image from "next/image";
import Link from "next/link";

/**
 * The site footer, rendered once for every page from app/layout.tsx.
 *
 * This is a Server Component — there's no "use client" at the top. It has no
 * state, no clicks to handle and no browser APIs to call, so React can render it
 * to HTML on the server and send zero JavaScript for it to the browser.
 *
 * Two things changed while converting this from the original React version:
 *
 * 1. The icons are written out as inline SVG instead of importing from
 *    `react-icons`. Four icons aren't worth a dependency, and inline SVG is
 *    styled by CSS like any other element — `currentColor` below means each icon
 *    simply inherits the text colour of whatever it sits inside.
 *
 * 2. The logo is referenced as "/images/Grey-logo.png" instead of being
 *    imported from an assets folder. In Next.js, anything inside `public/` is
 *    served straight from the site root, so `public/images/Grey-logo.png`
 *    becomes the URL `/images/Grey-logo.png`. No import needed.
 */

/**
 * One item in a footer column.
 *
 * `href` is optional on purpose. Some of these labels — Careers, Blog, Privacy
 * Policy — describe pages this app doesn't have yet. An item with an `href`
 * renders as a real link; an item without one renders as plain text.
 *
 * Linking to a page that doesn't exist would send people to a 404, which looks
 * far worse than a label that simply isn't clickable. When you build one of
 * those pages later, add its `href` here and it becomes a link on its own.
 */
type FooterLink = {
  label: string;
  href?: string;
};

type FooterColumn = {
  heading: string;
  links: FooterLink[];
};

/**
 * The footer's contents as data rather than as repeated JSX.
 *
 * Describing it this way means the markup below is written once and looped over.
 * Adding a link is editing this list — you never touch the layout.
 */
const columns: FooterColumn[] = [
  {
    heading: "Company",
    links: [
      // "#about" jumps to the About section on the home page. See the
      // matching id in app/home/page.tsx.
      { label: "About us", href: "/home#about" },
      { label: "Our Team", href: "/doctors" },
      { label: "Blog" },
      { label: "Careers" },
      { label: "Mission & Values" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Health Tips" },
      { label: "Patient Education" },
      { label: "Wellness Programs", href: "/services" },
      { label: "News & Updates" },
      { label: "Community Outreach" },
    ],
  },
  {
    heading: "Get Help",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "FAQ", href: "/home#faq" },
      { label: "Support Centre", href: "/contact" },
      { label: "Privacy Policy" },
      { label: "Terms of Use" },
    ],
  },
];

/**
 * Keyboard focus ring, matching the one in the header.
 *
 * `focus-visible` rather than `focus` so the ring appears for people tabbing
 * with a keyboard but not for mouse clicks.
 */
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded";

export default function Footer() {
  /*
    The year is read at render time so the copyright never goes stale.

    This is safe to do here because the footer only ever renders on the server —
    if a Client Component did this, the year could in theory differ between the
    server's HTML and the browser's first render and React would warn about a
    mismatch.
  */
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 p-3 text-white">
      <div className="mx-auto w-11/12 max-w-6xl py-8">
        <Link href="/home" aria-label="HealthNet home" className={focusRing}>
          {/*
            `h-auto` keeps the logo's proportions. The width and height props are
            the image's real pixel size (200×62) — Next uses them to reserve the
            right amount of space before the file loads, which stops the page
            jumping about. The CSS width then scales it, and h-auto lets the
            height follow.
          */}
          <Image
            src="/images/Grey-logo.png"
            alt="HealthNet"
            width={200}
            height={62}
            className="h-auto w-36"
          />
        </Link>

        <p className="mt-3 max-w-sm text-xs leading-relaxed text-gray-400">
          Book appointments, keep your medical details in one place, and talk to
          a doctor without the queue.
        </p>

        {/* Three columns side by side from the `md` breakpoint up, stacked below it. */}
        <div className="mt-8 gap-8 md:grid md:grid-cols-3">
          {columns.map((column) => (
            <nav key={column.heading} className="mt-8 md:mt-0">
              <h2 className="foot-head">{column.heading}</h2>

              <ul className="foot-list mt-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <Link href={link.href} className={focusRing}>
                        {link.label}
                      </Link>
                    ) : (
                      /*
                        No href, so this isn't a link — plain text instead.

                        `cursor-default` cancels the pointer cursor that
                        `.foot-list li` applies, otherwise this would look
                        clickable and do nothing. The dimmer grey is a second
                        hint. (It also cancels the hover colour for free: a
                        colour set on the span itself always beats one inherited
                        from the li.)
                      */
                      <span className="cursor-default text-gray-400">
                        {link.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ---------- Social links ---------- */}
        <ul className="social-list mt-10 flex items-center justify-center">
          {socialLinks.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                /*
                  Opening in a new tab needs both of these:
                  - target="_blank" opens the tab.
                  - rel="noopener noreferrer" stops the new page from getting a
                    reference back to ours, which it could otherwise use to
                    redirect this tab somewhere else.
                */
                target="_blank"
                rel="noopener noreferrer"
                /*
                  The icon itself is hidden from screen readers (see aria-hidden
                  below), so the link needs a text label of its own. Without one
                  it would be announced as just "link".
                */
                aria-label={`HealthNet on ${social.label}`}
                className={`inline-flex p-1 ${focusRing}`}
              >
                {social.icon}
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-gray-400">
          © {year} HealthNet.
        </p>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------------------
   Icons

   Each one is a tiny component returning an <svg>. Notes that apply to all:

   - `fill="currentColor"` means the shape is painted in the element's text
     colour, so the hover colour from .social-list li works on the icon too.
   - `aria-hidden` hides them from screen readers. They're decoration; the
     link's aria-label carries the meaning.
   - `viewBox` is the icon's own coordinate system. h-5 w-5 sets the size on
     screen and the SVG scales to fit, which is why these never blur.
   --------------------------------------------------------------------------- */

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg
      viewBox="0 0 18 16"
      fill="currentColor"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M5.026 15c6.038 0 10.81-5.176 10.81-9.66 0-.147 0-.293-.01-.439A7.72 7.72 0 0 0 18 2.92a7.6 7.6 0 0 1-2.184.598 3.84 3.84 0 0 0 1.685-2.12 7.68 7.68 0 0 1-2.435.926A3.83 3.83 0 0 0 8.51 6.36a10.86 10.86 0 0 1-7.89-4 3.83 3.83 0 0 0 1.19 5.11 3.8 3.8 0 0 1-1.74-.48v.05a3.83 3.83 0 0 0 3.07 3.75 3.8 3.8 0 0 1-1.73.066 3.83 3.83 0 0 0 3.58 2.66A7.66 7.66 0 0 1 0 13.58a10.8 10.8 0 0 0 5.026 1.47z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    /*
      This one is drawn with strokes instead of a filled shape — a rounded
      square, a circle for the lens and a dot. `stroke="currentColor"` is the
      stroke equivalent of fill="currentColor".
    */
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      className="h-5 w-5"
    >
      <rect x="2" y="2" width="20" height="20" rx="6" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/**
 * The social links, kept next to the icons that draw them.
 *
 * These point at the platforms' home pages for now — swap in the real HealthNet
 * profile URLs when they exist.
 */
const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/", icon: <FacebookIcon /> },
  { label: "Twitter", href: "https://twitter.com/", icon: <TwitterIcon /> },
  { label: "Instagram", href: "https://www.instagram.com/", icon: <InstagramIcon /> },
  { label: "GitHub", href: "https://github.com/", icon: <GitHubIcon /> },
];
