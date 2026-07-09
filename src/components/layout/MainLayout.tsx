/**
 * CineSync — MainLayout
 *
 * The reusable application shell: Navbar + main content + Footer.
 * Used by the root layout so every view shares the same chrome.
 *
 * The root wrapper uses `min-h-screen flex flex-col` and the main element
 * uses `flex-1`, which makes the Footer stick to the bottom on short pages
 * and push down naturally when content overflows (no overlap, no floating).
 */

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
