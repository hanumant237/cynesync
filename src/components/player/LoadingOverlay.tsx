"use client";

/**
 * CineSync — LoadingOverlay
 *
 * Premium loading / buffering overlay: a gradient ring spinner with a subtle
 * pulsing glow. Shown while the player is loading a source or buffering.
 */

import { AnimatePresence, motion } from "framer-motion";

export interface LoadingOverlayProps {
  visible: boolean;
  /** Optional label shown beneath the spinner (e.g. "Buffering…"). */
  label?: string;
}

export function LoadingOverlay({ visible, label }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/30 backdrop-blur-sm"
        >
          {/* Gradient ring spinner */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-brand-purple/20" />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-brand-purple border-r-brand-blue" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
          </div>
          {label ? (
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              {label}
            </span>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
