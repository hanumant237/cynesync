"use client";

/**
 * CineSync — PageHeader
 *
 * Reusable header for inner pages (Library, Player, Watch Party, Settings).
 * Renders an eyebrow, a title, and an optional description, with a subtle
 * entrance animation. Keeps every page's top consistent.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GradientText } from "@/components/common/GradientText";

export function PageHeader({
  eyebrow,
  title,
  titleGradient,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  titleGradient?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="flex flex-col gap-2">
        {eyebrow ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-brand-purple-soft">
            <span className="h-1 w-1 rounded-full bg-brand-purple" />
            {eyebrow}
          </span>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title} {titleGradient ? <GradientText>{titleGradient}</GradientText> : null}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </motion.div>
  );
}
