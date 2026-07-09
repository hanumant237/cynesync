"use client";

/**
 * CineSync — InviteCard
 *
 * Displays the room code prominently with a copy-to-clipboard button and a
 * shareable invite link. Used in the room view so the host can invite others.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { cn } from "@/lib/utils";

export function InviteCard({ roomCode }: { roomCode: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/#watch-party?room=${roomCode}`
      : `#watch-party?room=${roomCode}`;

  const copyToClipboard = async (text: string, kind: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context) — silently ignore.
    }
  };

  return (
    <GlassCard className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Share2 className="h-4 w-4 text-brand-purple-soft" />
          Invite
        </h3>
      </div>

      {/* Room code */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Room Code
        </span>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em] text-foreground">
            {roomCode}
          </code>
          <button
            type="button"
            onClick={() => copyToClipboard(roomCode, "code")}
            aria-label="Copy room code"
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors",
              copied === "code"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
            )}
          >
            <motion.span
              key={copied === "code" ? "check" : "copy"}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {copied === "code" ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </motion.span>
          </button>
        </div>
      </div>

      {/* Invite link */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Invite Link
        </span>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs text-muted-foreground">{inviteLink}</span>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(inviteLink, "link")}
            aria-label="Copy invite link"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
              copied === "link"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
            )}
          >
            <motion.span
              key={copied === "link" ? "check" : "copy"}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </motion.span>
          </button>
        </div>
      </div>

      {copied ? (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-emerald-300"
        >
          Copied to clipboard!
        </motion.p>
      ) : null}
    </GlassCard>
  );
}
