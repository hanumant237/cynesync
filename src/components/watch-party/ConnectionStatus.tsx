"use client";

/**
 * CineSync — ConnectionStatus
 *
 * Animated connection indicator. Shows a pulsing dot + label for each
 * connection state: connected (green), connecting (amber), reconnecting
 * (amber pulsing), disconnected (red).
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConnectionStatusKind } from "@/types/watchParty";

const STATUS_CONFIG: Record<
  ConnectionStatusKind,
  { label: string; dotClass: string; ringClass: string; pulse: boolean }
> = {
  connected: {
    label: "Connected",
    dotClass: "bg-emerald-400",
    ringClass: "ring-emerald-400/30",
    pulse: false,
  },
  connecting: {
    label: "Connecting",
    dotClass: "bg-amber-400",
    ringClass: "ring-amber-400/30",
    pulse: true,
  },
  reconnecting: {
    label: "Reconnecting",
    dotClass: "bg-amber-400",
    ringClass: "ring-amber-400/30",
    pulse: true,
  },
  disconnected: {
    label: "Disconnected",
    dotClass: "bg-red-400",
    ringClass: "ring-red-400/30",
    pulse: false,
  },
};

export function ConnectionStatus({
  status,
  className,
}: {
  status: ConnectionStatusKind;
  className?: string;
}) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground/80",
        className,
      )}
    >
      <span className={cn("relative flex h-2 w-2", cfg.ringClass)}>
        {cfg.pulse ? (
          <motion.span
            className={cn("absolute inline-flex h-full w-full rounded-full", cfg.dotClass)}
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", cfg.dotClass)} />
        )}
      </span>
      {cfg.label}
    </span>
  );
}
