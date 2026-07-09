"use client";

/**
 * CineSync — Logo
 *
 * Reusable brand lockup: a gradient "play" mark + the CineSync wordmark.
 * Used in the Navbar, Footer, and 404 page. Clicking navigates home.
 */

import { useNavigation } from "@/hooks/useNavigation";
import { APP_NAME } from "@/utils/constants";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  const { navigate } = useNavigation();

  return (
    <button
      type="button"
      onClick={() => navigate("home")}
      aria-label={`${APP_NAME} home`}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        className,
      )}
    >
      <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-purple via-brand-purple to-brand-blue shadow-[0_4px_16px_rgba(139,92,246,0.45)] transition-transform duration-300 group-hover:scale-105">
        <Play className="h-4 w-4 fill-white text-white" />
        <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </span>
      {showWordmark ? (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Cine<span className="text-gradient-brand">Sync</span>
        </span>
      ) : null}
    </button>
  );
}
