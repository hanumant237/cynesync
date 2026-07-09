"use client";

/**
 * CineSync — MainLayout
 *
 * The reusable application shell: Navbar + main content + Footer.
 * The root wrapper uses `min-h-screen flex flex-col` and `main` uses `flex-1`,
 * so the Footer sticks to the viewport bottom on short pages and is pushed
 * down naturally when content overflows (no overlap, no floating).
 *
 * The animated background glow sits behind all content for the premium feel.
 */

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient background glow (fixed, non-interactive) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-hero-glow"
      />
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
