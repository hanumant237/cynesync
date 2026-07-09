"use client";

/**
 * CineSync — ChatMessage
 *
 * A single chat message. User messages show an avatar (gradient initial),
 * username, timestamp, and the message text. System messages (join/leave/
 * play/pause) are rendered as a centered, muted pill with an icon.
 *
 * Message pop animation via Framer Motion (handled by the parent's
 * AnimatePresence).
 */

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/types/watchParty";
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

/** Format a timestamp as "h:mm AM/PM". */
function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChatMessage({
  message,
  isMine,
}: {
  message: ChatMessageType;
  isMine: boolean;
}) {
  // System message: centered pill.
  if (message.type === "system") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex justify-center py-1"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3 shrink-0 text-brand-purple-soft" />
          {message.text}
        </span>
      </motion.div>
    );
  }

  // User message.
  const username = message.username ?? "Unknown";
  const initial = username.charAt(0).toUpperCase() || "?";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("flex gap-2.5", isMine && "flex-row-reverse")}
    >
      {/* Avatar */}
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white",
          avatarGradient(username),
        )}
      >
        {initial}
      </span>

      {/* Bubble */}
      <div className={cn("flex max-w-[75%] flex-col gap-0.5", isMine && "items-end")}>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-foreground/80">
            {isMine ? "You" : username}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        <div
          className={cn(
            "rounded-2xl px-3 py-1.5 text-sm",
            isMine
              ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white"
              : "bg-white/5 text-foreground/90",
          )}
        >
          {message.text}
        </div>
      </div>
    </motion.div>
  );
}
