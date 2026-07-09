/**
 * CineSync — Footer (placeholder)
 *
 * Simple footer rendered at the bottom of the MainLayout. The layout uses a
 * flex column with `mt-auto` so the footer sticks to the viewport bottom on
 * short pages and is pushed down naturally on long pages.
 */

import { APP_NAME, APP_TAGLINE, APP_VERSION } from "@/utils/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-sm text-muted-foreground sm:flex-row">
        <p>
          <span className="font-medium text-foreground">{APP_NAME}</span> — {APP_TAGLINE}
        </p>
        <p>
          v{APP_VERSION} · © {year} {APP_NAME}
        </p>
      </div>
    </footer>
  );
}
