"use client";

/**
 * CineSync — PageTransition
 *
 * Wraps page content in a subtle fade + rise entrance animation. Keyed by the
 * caller (usually the active view id) so AnimatePresence can animate between
 * views in `src/app/page.tsx`.
 */

import { motion } from "framer-motion";

export function PageTransition({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
