"use client";

/**
 * CineSync — VolumeSlider
 *
 * Reusable volume control: a mute/unmute icon button paired with a horizontal
 * slider that expands on hover. Pointer-driven scrubbing, fully accessible.
 */

import { useCallback, useRef, useState } from "react";
import { Volume1, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAYER_CONSTANTS } from "@/utils/player";

export interface VolumeSliderProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

/** Pick the icon that best represents the current audible level. */
function VolumeIcon({ volume, muted }: { volume: number; muted: boolean }) {
  if (muted || volume === 0) return <VolumeX className="h-[1.15rem] w-[1.15rem]" />;
  if (volume < 0.5) return <Volume1 className="h-[1.15rem] w-[1.15rem]" />;
  return <Volume2 className="h-[1.15rem] w-[1.15rem]" />;
}

export function VolumeSlider({
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
}: VolumeSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const effectiveVolume = muted ? 0 : volume;
  const pct = effectiveVolume * 100;

  const positionToVolume = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * PLAYER_CONSTANTS.MAX_VOLUME;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      onVolumeChange(positionToVolume(e.clientX));
    },
    [onVolumeChange, positionToVolume],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragging) onVolumeChange(positionToVolume(e.clientX));
    },
    [dragging, onVolumeChange, positionToVolume],
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

  return (
    <div className="group/volume flex items-center">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 hover:text-white"
      >
        <VolumeIcon volume={volume} muted={muted} />
      </button>

      <div
        className={cn(
          "flex h-9 items-center overflow-hidden transition-all duration-200",
          "w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100",
          dragging && "w-20 opacity-100",
        )}
      >
        <div
          ref={trackRef}
          role="slider"
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              onVolumeChange(volume - PLAYER_CONSTANTS.VOLUME_STEP);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              onVolumeChange(volume + PLAYER_CONSTANTS.VOLUME_STEP);
            }
          }}
          className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/20"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white"
            style={{ width: `${pct}%` }}
          />
          <div
            className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
            style={{ left: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
