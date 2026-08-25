// app/(auth)/layout.tsx
import type { ReactNode } from "react";

/**
 * Auth layout
 * - Wraps auth pages with a consistent background + spacing
 * - URL does NOT include "(auth)" (route group)
 *
 * The height is 100vh minus 4rem, the height of the site header above it. Same
 * value the dashboard layouts use, written the same way so a search finds all
 * three if you ever change the header's height.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-r from-primaryLight/20 via-white to-emerald-50 px-4 py-16">
      {children}
    </section>
  );
}