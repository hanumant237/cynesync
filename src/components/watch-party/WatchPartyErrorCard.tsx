"use client";

/**
 * CineSync — WatchPartyError
 *
 * Professional error card for watch-party failure states. Maps each error
 * kind to an appropriate icon, title, and message. Shows a "Back to lobby"
 * button and an optional "Retry" button when the error is retryable.
 */

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CloudOff,
  Crown,
  DoorClosed,
  LogOut,
  RotateCcw,
  Search,
  WifiOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import type { WatchPartyUiError } from "@/types/watchParty";

const ERROR_ICONS: Record<WatchPartyUiError["kind"], LucideIcon> = {
  "room-not-found": Search,
  "connection-failed": CloudOff,
  disconnected: WifiOff,
  "host-left": Crown,
  "room-closed": DoorClosed,
  "duplicate-username": AlertTriangle,
  "not-host": Crown,
  generic: AlertTriangle,
};

export function WatchPartyErrorCard({
  error,
  onRetry,
  onBackToLobby,
}: {
  error: WatchPartyUiError;
  onRetry?: () => void;
  onBackToLobby: () => void;
}) {
  const Icon = ERROR_ICONS[error.kind] ?? AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto w-full max-w-md"
    >
      <GlassCard className="flex flex-col items-center gap-5 p-8 text-center">
        <motion.span
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400"
        >
          <Icon className="h-8 w-8" />
        </motion.span>

        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-foreground">{error.title}</h3>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {error.message}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {error.retryable && onRetry ? (
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
            onClick={onBackToLobby}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Back to lobby
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
