"use client";

/**
 * CineSync — ErrorOverlay
 *
 * Polished error screen shown when playback fails. Displays an error icon, a
 * friendly message, and a Retry button that re-loads the current source.
 */

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, RotateCcw } from "lucide-react";

export interface ErrorOverlayProps {
  visible: boolean;
  message: string;
  onRetry: () => void;
}

export function ErrorOverlay({ visible, message, onRetry }: ErrorOverlayProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center backdrop-blur-md"
        >
          <motion.span
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400"
          >
            <AlertCircle className="h-7 w-7" />
          </motion.span>

          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-white">
              Something went wrong
            </p>
            <p className="max-w-sm text-sm text-white/60">{message}</p>
          </div>

          <button
            type="button"
            onClick={onRetry}
            className="mt-1 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-5 text-sm font-medium text-white shadow-[0_6px_20px_rgba(139,92,246,0.35)] transition-transform duration-200 hover:scale-[1.03]"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
