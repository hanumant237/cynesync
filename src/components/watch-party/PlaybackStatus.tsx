"use client";

/**
 * CineSync — PlaybackStatus
 *
 * Displays the current room's playback state: playing/paused, current
 * position, playback speed, and the video URL. Reused in the room view.
 */

import { motion } from "framer-motion";
import { Gauge, Link2, Pause, Play } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { formatTime } from "@/utils/player";
import type { PlaybackSyncState } from "@/types/watchParty";

export function PlaybackStatus({
  playback,
  currentPosition,
  videoUrl,
}: {
  playback: PlaybackSyncState;
  currentPosition: number;
  videoUrl: string;
}) {
  const isPlaying = playback.state === "playing";
  const displayedPosition = isPlaying ? currentPosition : playback.position;

  return (
    <GlassCard className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Playback</h3>
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium " +
            (isPlaying
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-white/5 text-muted-foreground")
          }
        >
          {isPlaying ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          {isPlaying ? "Playing" : "Paused"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {/* Position */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Position
          </span>
          <motion.span
            key={Math.floor(displayedPosition)}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className="font-mono text-lg font-semibold tabular-nums text-foreground"
          >
            {formatTime(displayedPosition)}
          </motion.span>
        </div>

        {/* Speed */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Speed
          </span>
          <span className="inline-flex items-center gap-1.5 text-lg font-semibold text-foreground">
            <Gauge className="h-3.5 w-3.5 text-brand-purple-soft" />
            {playback.speed}x
          </span>
        </div>

        {/* Sync anchor */}
        <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Synced at
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {new Date(playback.lastUpdatedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Video URL */}
      <div className="flex items-center gap-2 border-t border-white/10 pt-3">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs text-muted-foreground" title={videoUrl}>
          {videoUrl || "No video loaded"}
        </span>
      </div>
    </GlassCard>
  );
}
