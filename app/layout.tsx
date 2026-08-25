import type { Metadata } from "next";

import "./globals.css";
import { Poppins } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/auth";

/**
 * The app's typeface.
 *
 * The history here is worth keeping, because it's the same trap twice.
 *
 * This started as PT Sans, which only ships weights 400 and 700. The app uses
 * `font-semibold` (600) in 27 places, and when a browser is asked for a weight
 * a family doesn't have it doesn't fail — it quietly substitutes the nearest one
 * it does have. So every 600 rendered at 700, identical to `font-bold`, and the
 * whole type hierarchy flattened from three levels into two.
 *
 * Poppins carries the same risk for a different reason: it is *not* a variable
 * font. Google serves it as separate static files, one per weight. With a
 * variable font (the previous Source Sans 3) you can leave `weight` off and get
 * every weight from a single file. With a static family you have to name the
 * weights you want, and any weight you don't name simply isn't downloaded —
 * which would put us straight back into the PT Sans bug.
 *
 * So the three below aren't arbitrary. They are exactly what the app uses:
 * 400 for body text, 600 for `font-semibold`, 700 for `font-bold`. Naming 600
 * here is the line that keeps that bug fixed. Loading only three keeps it to
 * three font files rather than the nine Poppins offers.
 *
 * `variable` exposes the font as a CSS custom property rather than a class,
 * which is what lets globals.css hand it to Tailwind as the default sans font.
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "HealthNet — Hospital Management",
  description:
    "Book appointments, manage patient records and run a clinic from one dashboard.",
  icons: {
    icon: "/new-icon.ico",
    apple: "/new-icon.ico",
  },
};

/**
 * The root layout wraps every page.
 *
 * It's `async` now because it reads the session so the header can show either
 * "Log in / Sign up" or the person's name and a "Log out" button.
 *
 * Worth knowing: reading the session reads a cookie, and reading a cookie makes
 * a route render per-request instead of being built once at deploy time. Since
 * this layout wraps everything, that applies to the whole site — which is what
 * you want for an app where the header changes depending on who's looking.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      {/*
        `flex flex-col` with `flex-1` on the main content is what pins the footer
        to the bottom of short pages. Without it, a page with little content
        leaves the footer floating halfway up the screen.
      */}
      <body className="flex min-h-full flex-col">
        {/*
          We pass only the three fields the header displays rather than the whole
          user record. Anything handed to a Client Component gets serialised and
          sent to the browser, and the record includes the password hash.
        */}
        <Header
          user={
            user
              ? { name: user.name, email: user.email, role: user.role }
              : null
          }
        />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
