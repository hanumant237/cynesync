"use client";

/**
 * CineSync — StreamPreparing
 *
 * Premium loading overlay shown while the backend prepares a stream. Displays
 * an animated gradient ring spinner, the current stage message, and a staged
 * progress indicator that fills as the preparation advances through its
 * lifecycle (preparing → detecting → transcoding → ready).
 *
 * Shown over the player area (absolute inset-0) so it replaces the idle state
 * while the backend is working.
 */

import { AnimatePresence, motion } from "framer-motion";
import type { PrepareState } from "@/types/stream";

export interface StreamPreparingProps {
  visible: boolean;
  /** Current preparation stage. */
  state: PrepareState;
  /** Loading message to display. */
  message: string;
}

/** Ordered stages for the progress indicator. */
const STAGES: ReadonlyArray<Exclude<PrepareState, "idle" | "error">> = [
  "preparing",
  "detecting",
  "transcoding",
  "ready",
];

export function StreamPreparing({ visible, state, message }: StreamPreparingProps) {
  const currentIndex = STAGES.indexOf(
    state as Exclude<PrepareState, "idle" | "error">,
  );
  const progress =
    currentIndex >= 0
      ? ((currentIndex + 1) / STAGES.length) * 100
      : 0;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-brand-purple/10 via-black to-brand-blue/10 px-6 text-center backdrop-blur-sm"
        >
          {/* Animated gradient ring spinner */}
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-brand-purple/20" />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-brand-purple border-r-brand-blue" />
            <span className="absolute inset-2 animate-spin rounded-full border border-white/5 border-b-brand-blue/60 [animation-direction:reverse] [animation-duration:1.5s]" />
            <span className="h-3 w-3 rounded-full bg-white/90 shadow-[0_0_16px_rgba(255,255,255,0.7)]" />
          </div>

          {/* Stage message */}
          <AnimatePresence mode="wait">
            <motion.p
              key={message}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium uppercase tracking-[0.18em] text-white/80"
            >
              {message}
            </motion.p>
          </AnimatePresence>

          {/* Staged progress indicator */}
          <div className="flex w-full max-w-xs flex-col gap-2">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-blue"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-white/40">
              {STAGES.map((stage) => (
                <span
                  key={stage}
                  className={
                    STAGES.indexOf(stage as typeof STAGES[number]) <= currentIndex
                      ? "text-brand-purple-soft"
                      : ""
                  }
                >
                  {stage === "preparing"
                    ? "Prepare"
                    : stage === "detecting"
                      ? "Detect"
                      : stage === "transcoding"
                        ? "Transcode"
                        : "Ready"}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
