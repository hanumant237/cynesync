"use client";

/**
 * CineSync — ParticipantCard
 *
 * A single participant row: avatar (gradient initial), username, host badge,
 * and an online-status dot. Animated entrance (slide + fade) and exit
 * (scale + fade) via Framer Motion's AnimatePresence (handled by the parent).
 */

import { motion } from "framer-motion";
import { HostBadge } from "./HostBadge";
import type { Participant } from "@/types/watchParty";
import { cn } from "@/lib/utils";

/** Deterministic gradient based on the username's first char. */
function avatarGradient(username: string): string {
  const gradients = [
    "from-brand-purple to-brand-blue",
    "from-pink-500 to-rose-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-cyan-500 to-sky-500",
    "from-violet-500 to-fuchsia-500",
  ];
  const idx = (username.charCodeAt(0) || 0) % gradients.length;
  return gradients[idx];
}

export function ParticipantCard({
  participant,
  isMe,
}: {
  participant: Participant;
  isMe: boolean;
}) {
  const initial = participant.username.charAt(0).toUpperCase() || "?";
  const isOnline = participant.status === "connected";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 12, scale: 0.9 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white",
            avatarGradient(participant.username),
          )}
        >
          {initial}
        </span>
        {/* Online dot */}
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
            isOnline ? "bg-emerald-400" : "bg-red-400",
          )}
        />
      </div>

      {/* Name + badges */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {participant.username}
          </span>
          {isMe ? (
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/70">
              You
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {participant.isHost ? <HostBadge /> : null}
          <span
            className={cn(
              "text-[10px] uppercase tracking-wider",
              isOnline ? "text-emerald-300/70" : "text-red-300/70",
            )}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
