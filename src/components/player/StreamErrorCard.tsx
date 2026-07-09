"use client";

/**
 * CineSync — StreamErrorCard
 *
 * Friendly error card shown over the player area when stream preparation
 * fails (backend error, network failure, timeout, unsupported media, etc.).
 * Maps the error code to an appropriate icon and shows a Retry button when
 * the error is retryable.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CloudOff,
  FileQuestion,
  RotateCcw,
  ServerCrash,
  Timer,
  WifiOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StreamError } from "@/types/stream";

export interface StreamErrorCardProps {
  visible: boolean;
  error: StreamError | null;
  onRetry: () => void;
  onDismiss: () => void;
}

/** Map an error code to the most relevant icon. */
function iconForCode(code: string): LucideIcon {
  switch (code) {
    case "SERVER_UNREACHABLE":
    case "NETWORK_ERROR":
      return CloudOff;
    case "REQUEST_TIMEOUT":
    case "URL_TIMEOUT":
    case "INSPECTION_TIMEOUT":
    case "FFMPEG_TIMEOUT":
      return Timer;
    case "UNSUPPORTED_FORMAT":
    case "SEGMENT_NOT_FOUND":
    case "SESSION_NOT_FOUND":
      return FileQuestion;
    case "FFMPEG_FAILED":
    case "FFPROBE_MISSING":
    case "INTERNAL_ERROR":
      return ServerCrash;
    case "INVALID_URL":
      return AlertTriangle;
    default:
      return WifiOff;
  }
}

/** Map an error code to a short, user-friendly title. */
function titleForCode(code: string): string {
  switch (code) {
    case "SERVER_UNREACHABLE":
      return "Server unreachable";
    case "REQUEST_TIMEOUT":
    case "URL_TIMEOUT":
      return "Request timed out";
    case "INSPECTION_TIMEOUT":
      return "Inspection timed out";
    case "FFMPEG_TIMEOUT":
      return "Transcoding timed out";
    case "UNSUPPORTED_FORMAT":
      return "Unsupported media";
    case "FFMPEG_FAILED":
      return "Transcoding failed";
    case "FFPROBE_MISSING":
      return "Server misconfigured";
    case "INVALID_URL":
      return "Invalid URL";
    case "INTERNAL_ERROR":
      return "Server error";
    default:
      return "Something went wrong";
  }
}

export function StreamErrorCard({ visible, error, onRetry, onDismiss }: StreamErrorCardProps) {
  return (
    <AnimatePresence>
      {visible && error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 px-6 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="glass flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl p-8 text-center shadow-2xl"
          >
            {(() => {
              const Icon = iconForCode(error.code);
              return (
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
                  <Icon className="h-7 w-7" />
                </span>
              );
            })()}

            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-white">
                {titleForCode(error.code)}
              </h3>
              <p className="text-sm leading-relaxed text-white/60">
                {error.message}
              </p>
            </div>

            <div className="mt-1 flex items-center gap-2">
              {error.retryable ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-5 text-sm font-medium text-white shadow-[0_6px_20px_rgba(139,92,246,0.35)] transition-transform duration-200 hover:scale-[1.03]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </button>
              ) : null}
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Dismiss
              </button>
            </div>

            {error.code !== "UNKNOWN_ERROR" ? (
              <span className="mt-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/40">
                {error.code}
              </span>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
