"use client";

/**
 * CineSync — GlassCard
 *
 * Reusable glassmorphism surface: translucent white overlay + backdrop blur +
 * subtle border + soft shadow + rounded corners. Built on Framer Motion so
 * hover lift animations are opt-in via the `interactive` prop.
 *
 * This is the primary card primitive for the premium CineSync UI. Avoid
 * hand-rolling glass styles elsewhere — use this component.
 */

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  /** Enable hover lift + glow. Defaults to false. */
  interactive?: boolean;
  /** Accent ring color shown on interactive hover. */
  accent?: "purple" | "blue";
}

export function GlassCard({
  className,
  children,
  interactive = false,
  accent = "purple",
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "glass rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        interactive && "transition-colors duration-300 hover:border-white/15",
        accent === "purple" && interactive &&
          "hover:shadow-[0_12px_48px_rgba(139,92,246,0.18)]",
        accent === "blue" && interactive &&
          "hover:shadow-[0_12px_48px_rgba(59,130,246,0.18)]",
        className,
      )}
      whileHover={
        interactive
          ? { y: -4, transition: { duration: 0.25, ease: "easeOut" } }
          : undefined
      }
      {...props}
    >
      {children}
    </motion.div>
  );
}
