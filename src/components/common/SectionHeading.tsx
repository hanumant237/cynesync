"use client";

/**
 * CineSync — SectionHeading
 *
 * Reusable section header: small eyebrow label, a title (with optional
 * gradient emphasis), and a supporting description. Animates in on view.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GradientText } from "@/components/common/GradientText";

export function SectionHeading({
  eyebrow,
  title,
  titleGradient,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  /** Word(s) within the title to render with the brand gradient. */
  titleGradient?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "flex flex-col gap-3",
        centered && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-brand-purple-soft">
          <span className="h-1 w-1 rounded-full bg-brand-purple" />
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
        {title} {titleGradient ? <GradientText>{titleGradient}</GradientText> : null}
      </h2>
      {description ? (
        <p className={cn("max-w-2xl text-sm text-muted-foreground sm:text-base", centered && "mx-auto")}>
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}
