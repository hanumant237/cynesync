"use client";

/**
 * CineSync — SeekBar
 *
 * Reusable progress bar for the player. Shows buffered progress, played
 * progress, a draggable thumb, and a hover preview tooltip with the
 * timestamp. Fully pointer-driven (mouse + touch).
 */

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatTime, PLAYER_CONSTANTS } from "@/utils/player";

export interface SeekBarProps {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (time: number) => void;
}

export function SeekBar({
  currentTime,
  duration,
  buffered,
  onSeek,
}: SeekBarProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const safeDuration = duration > 0 ? duration : 0;
  const playedPct = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;
  const bufferedPct = safeDuration > 0 ? (buffered / safeDuration) * 100 : 0;

  /** Convert a pointer X position into a seek time. */
  const positionToTime = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || safeDuration <= 0) return 0;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * safeDuration;
    },
    [safeDuration],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      onSeek(positionToTime(e.clientX));
    },
    [onSeek, positionToTime],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const time = positionToTime(e.clientX);
      setHoverTime(time);
      const track = trackRef.current;
      if (track) {
        const rect = track.getBoundingClientRect();
        setHoverX(Math.max(0, Math.min(rect.width, e.clientX - rect.left)));
      }
      if (dragging) onSeek(time);
    },
    [dragging, onSeek, positionToTime],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragging) {
        setDragging(false);
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      }
    },
    [dragging],
  );

  const handlePointerLeave = useCallback(() => {
    if (!dragging) setHoverTime(null);
  }, [dragging]);

  return (
    <div className="group/seek relative flex h-5 w-full cursor-pointer items-center">
      {/* Hover timestamp tooltip */}
      {hoverTime !== null ? (
        <div
          className="pointer-events-none absolute -top-8 z-10 -translate-x-1/2 rounded-md border border-white/10 bg-black/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white shadow-lg backdrop-blur"
          style={{ left: hoverX }}
        >
          {formatTime(hoverTime)}
        </div>
      ) : null}

      {/* Track */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.floor(safeDuration)}
        aria-valuenow={Math.floor(currentTime)}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            onSeek(currentTime - PLAYER_CONSTANTS.SEEK_SKIP_SECONDS);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            onSeek(currentTime + PLAYER_CONSTANTS.SEEK_SKIP_SECONDS);
          }
        }}
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/15 transition-all duration-150 group-hover/seek:h-2.5"
      >
        {/* Buffered */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/25"
          style={{ width: `${bufferedPct}%` }}
        />
        {/* Played */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue"
          style={{ width: `${playedPct}%` }}
        />
      </div>

      {/* Thumb */}
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-opacity duration-150",
          dragging ? "scale-110 opacity-100" : "opacity-0 group-hover/seek:opacity-100",
        )}
        style={{ left: `${playedPct}%` }}
      />
    </div>
  );
}
