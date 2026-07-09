"use client";

/**
 * CineSync — Container
 *
 * Consistent horizontal page gutter + max-width wrapper. Reused everywhere so
 * spacing stays uniform and there is no duplicated layout styling.
 */

import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
