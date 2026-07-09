"use client";

/**
 * CineSync — Navbar (placeholder)
 *
 * Top navigation bar. Renders the brand and the primary navigation items.
 * Navigation is performed via the in-app NavigationContext (hash-synced) so
 * no additional server routes are created.
 *
 * Styling is intentionally minimal in this foundation phase.
 */

import Link from "next/link";
import { useNavigation } from "@/hooks/useNavigation";
import { APP_NAME, NAV_ITEMS } from "@/utils/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { view, navigate } = useNavigation();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link
          href="/#home"
          className="flex items-center gap-2 font-semibold tracking-tight"
          onClick={(e) => {
            e.preventDefault();
            navigate("home");
          }}
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            C
          </span>
          <span>{APP_NAME}</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              aria-current={view === item.id ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                view === item.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
