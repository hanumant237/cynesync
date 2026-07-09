/**
 * CineSync — GradientText
 *
 * Renders its children with the purple → blue brand gradient. Use for emphasis
 * words in headlines and section titles.
 */

import { cn } from "@/lib/utils";

export function GradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("text-gradient-brand", className)}>{children}</span>;
}
