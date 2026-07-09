"use client";

/**
 * CineSync — PlayerControls
 *
 * The bottom control bar of the player. Composes the reusable SeekBar,
 * VolumeSlider, and PlaybackSpeedMenu plus play/pause, skip, time display,
 * Picture-in-Picture, and fullscreen toggles. Rendered with a glassmorphism
 * gradient backdrop and animated in/out via the parent.
 */

import {
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Rewind,
  FastForward,
} from "lucide-react";
import { SeekBar } from "@/components/player/SeekBar";
import { VolumeSlider } from "@/components/player/VolumeSlider";
import { PlaybackSpeedMenu } from "@/components/player/PlaybackSpeedMenu";
import { formatTime, PLAYER_CONSTANTS } from "@/utils/player";

export interface PlayerControlsProps {
  status: import("@/types/player").PlayerStatus;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isPiP: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkip: (deltaSeconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onToggleFullscreen: () => void;
  onTogglePiP: () => void;
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}

export function PlayerControls({
  status,
  currentTime,
  duration,
  buffered,
  volume,
  muted,
  playbackRate,
  isFullscreen,
  isPiP,
  onTogglePlay,
  onSeek,
  onSkip,
  onVolumeChange,
  onToggleMute,
  onPlaybackRateChange,
  onToggleFullscreen,
  onTogglePiP,
}: PlayerControlsProps) {
  const isPlaying = status === "playing";
  const ended = status === "ended";

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-3 pt-10 sm:px-4 sm:pb-4">
      {/* Seek bar */}
      <SeekBar
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        onSeek={onSeek}
      />

      {/* Control row */}
      <div className="mt-2 flex items-center gap-1 sm:gap-2">
        {/* Play / Pause */}
        <ControlButton
          label={isPlaying ? "Pause" : "Play"}
          onClick={onTogglePlay}
        >
          {ended ? (
            <Play className="h-[1.2rem] w-[1.2rem]" />
          ) : isPlaying ? (
            <Pause className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Play className="h-[1.2rem] w-[1.2rem]" />
          )}
        </ControlButton>

        {/* Skip back / forward */}
        <ControlButton
          label={`Back ${PLAYER_CONSTANTS.SEEK_SKIP_SECONDS} seconds`}
          onClick={() => onSkip(-PLAYER_CONSTANTS.SEEK_SKIP_SECONDS)}
        >
          <Rewind className="h-[1.15rem] w-[1.15rem]" />
        </ControlButton>
        <ControlButton
          label={`Forward ${PLAYER_CONSTANTS.SEEK_SKIP_SECONDS} seconds`}
          onClick={() => onSkip(PLAYER_CONSTANTS.SEEK_SKIP_SECONDS)}
        >
          <FastForward className="h-[1.15rem] w-[1.15rem]" />
        </ControlButton>

        {/* Volume */}
        <VolumeSlider
          volume={volume}
          muted={muted}
          onVolumeChange={onVolumeChange}
          onToggleMute={onToggleMute}
        />

        {/* Time */}
        <div className="ml-1 select-none text-xs font-medium tabular-nums text-white/80 sm:text-sm">
          <span className="text-white">{formatTime(currentTime)}</span>
          <span className="mx-1 text-white/40">/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Spacer */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Playback speed */}
          <PlaybackSpeedMenu rate={playbackRate} onChange={onPlaybackRateChange} />

          {/* Picture-in-Picture */}
          <ControlButton
            label={isPiP ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
            onClick={onTogglePiP}
          >
            <PictureInPicture2 className="h-[1.15rem] w-[1.15rem]" />
          </ControlButton>

          {/* Fullscreen */}
          <ControlButton
            label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="h-[1.15rem] w-[1.15rem]" />
            ) : (
              <Maximize className="h-[1.15rem] w-[1.15rem]" />
            )}
          </ControlButton>
        </div>
      </div>
    </div>
  );
}
