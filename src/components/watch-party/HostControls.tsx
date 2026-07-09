"use client";

/**
 * CineSync — HostControls
 *
 * Playback controls visible only to the host. Lets the host play/pause,
 * seek (draggable bar), change speed, and change the video URL.
 *
 * Participants never see this component — the parent conditionally renders
 * it based on `isHost`.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Gauge, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/common/GlassCard";
import { HostBadge } from "./HostBadge";
import { formatTime, PLAYBACK_RATES } from "@/utils/player";
import type { PlaybackSyncState } from "@/types/watchParty";
import { cn } from "@/lib/utils";

export interface HostControlsProps {
  playback: PlaybackSyncState;
  currentPosition: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (position: number) => void;
  onSpeedChange: (speed: number) => void;
  onVideoChange: (videoUrl: string) => void;
}

export function HostControls({
  playback,
  currentPosition,
  onPlay,
  onPause,
  onSeek,
  onSpeedChange,
  onVideoChange,
}: HostControlsProps) {
  const [speedOpen, setSpeedOpen] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoEditOpen, setVideoEditOpen] = useState(false);
  const isPlaying = playback.state === "playing";

  return (
    <GlassCard className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Crown className="h-4 w-4 text-brand-purple-soft" />
          Host Controls
        </h3>
        <HostBadge />
      </div>

      {/* Play / Pause + reset */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          className="h-11 flex-1 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-sm font-medium text-white shadow-[0_6px_20px_rgba(139,92,246,0.35)] transition-transform duration-200 hover:scale-[1.02]"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button
          type="button"
          onClick={() => onSeek(0)}
          variant="outline"
          aria-label="Reset to start"
          className="h-11 rounded-xl border-white/15 bg-white/5 px-4 text-foreground hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Seek bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{formatTime(currentPosition)}</span>
          <span className="text-[10px] uppercase tracking-wider">Seek</span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(currentPosition + 60, 600)}
          step={1}
          value={Math.min(currentPosition, 9999)}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand-purple"
          aria-label="Seek position"
        />
      </div>

      {/* Speed selector */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" />
            Playback speed
          </span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {playback.speed}x
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PLAYBACK_RATES.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => {
                onSpeedChange(rate);
                setSpeedOpen(false);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                Math.abs(rate - playback.speed) < 0.01
                  ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Change video */}
      <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
        {videoEditOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-col gap-2"
          >
            <Input
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              placeholder="https://… new video URL"
              aria-label="New video URL"
              className="h-10 rounded-xl border-white/10 bg-white/5 text-sm focus-visible:border-brand-purple/50 focus-visible:ring-brand-purple/30"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  if (videoUrlInput.trim()) {
                    onVideoChange(videoUrlInput.trim());
                    setVideoUrlInput("");
                    setVideoEditOpen(false);
                  }
                }}
                className="h-9 flex-1 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-xs text-white"
              >
                Apply
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setVideoEditOpen(false)}
                className="h-9 rounded-xl border-white/15 bg-white/5 px-4 text-xs text-foreground hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setVideoEditOpen(true)}
            className="h-9 rounded-xl border-white/15 bg-white/5 text-xs text-foreground hover:bg-white/10"
          >
            Change video
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
