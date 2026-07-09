"use client";

/**
 * CineSync — VideoPlayer
 *
 * The complete, self-contained media player. Owns the <video> element via the
 * useVideoPlayer hook and composes every overlay + the control bar. Handles:
 *  - HLS (hls.js) + native HTML5 playback
 *  - state-driven UI (loading / playing / paused / buffering / ended / error)
 *  - auto-hiding controls (reveal on mouse move, hide while playing)
 *  - center play / replay affordances
 *
 * This component contains no business logic — all behavior lives in the hook.
 */

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { useVideoPlayer } from "@/hooks/useVideoPlayer";
import { LoadingOverlay } from "@/components/player/LoadingOverlay";
import { ErrorOverlay } from "@/components/player/ErrorOverlay";
import { PlayerControls } from "@/components/player/PlayerControls";

export interface VideoPlayerProps {
  /** Source URL to load (HLS `.m3u8` or a native video file). */
  src: string | null;
  /** Auto-load the source as soon as it is provided. Defaults to true. */
  autoLoad?: boolean;
}

export function VideoPlayer({ src, autoLoad = true }: VideoPlayerProps) {
  const player = useVideoPlayer();
  const lastSrcRef = useRef<string | null>(null);

  // Load the source whenever it changes (and autoLoad is enabled).
  useEffect(() => {
    if (!autoLoad) return;
    if (src && src !== lastSrcRef.current) {
      lastSrcRef.current = src;
      player.loadSource(src);
    }
  }, [src, autoLoad, player]);

  const {
    videoRef,
    containerRef,
    status,
    currentTime,
    duration,
    buffered,
    volume,
    muted,
    playbackRate,
    isFullscreen,
    isPiP,
    controlsVisible,
    errorMessage,
    togglePlay,
    seek,
    skip,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleFullscreen,
    togglePiP,
    retry,
    revealControls,
  } = player;

  const isLoading = status === "loading";
  const isBuffering = status === "buffering";
  const isPaused = status === "paused";
  const isEnded = status === "ended";
  const isError = status === "error";
  const isIdle = status === "idle";

  // Controls stay visible unless actively playing & auto-hidden.
  const showControls =
    controlsVisible || isPaused || isEnded || isError || isIdle || isLoading;

  return (
    <div
      ref={containerRef}
      onMouseMove={revealControls}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
    >
      <video
        ref={videoRef}
        playsInline
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        className="h-full w-full bg-black"
      />

      {/* ---- Idle state: nothing loaded ---- */}
      {isIdle ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-purple/10 via-black to-brand-blue/10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur">
            <Play className="h-7 w-7 text-white/70" />
          </span>
          <p className="text-sm text-white/60">
            Paste a video URL above to start watching.
          </p>
        </div>
      ) : null}

      {/* ---- Loading / Buffering overlay ---- */}
      <LoadingOverlay
        visible={isLoading || isBuffering}
        label={isLoading ? "Loading" : "Buffering"}
      />

      {/* ---- Error overlay ---- */}
      <ErrorOverlay visible={isError} message={errorMessage} onRetry={retry} />

      {/* ---- Center play button (paused, not buffering) ---- */}
      <AnimatePresence>
        {isPaused && !isBuffering ? (
          <motion.button
            type="button"
            onClick={togglePlay}
            aria-label="Play"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-10 flex items-center justify-center"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-transform duration-200 hover:scale-110">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue shadow-[0_8px_32px_rgba(139,92,246,0.5)]">
                <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" />
              </span>
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      {/* ---- Replay button (ended) ---- */}
      <AnimatePresence>
        {isEnded ? (
          <motion.button
            type="button"
            onClick={() => {
              seek(0);
              togglePlay();
            }}
            aria-label="Replay"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-10 flex items-center justify-center"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-transform duration-200 hover:scale-110">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue shadow-[0_8px_32px_rgba(139,92,246,0.5)]">
                <RotateCcw className="h-7 w-7 text-white" />
              </span>
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>

      {/* ---- Control bar (auto-hide) ---- */}
      <AnimatePresence>
        {showControls && !isIdle ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 z-20"
          >
            <PlayerControls
              status={status}
              currentTime={currentTime}
              duration={duration}
              buffered={buffered}
              volume={volume}
              muted={muted}
              playbackRate={playbackRate}
              isFullscreen={isFullscreen}
              isPiP={isPiP}
              onTogglePlay={togglePlay}
              onSeek={seek}
              onSkip={skip}
              onVolumeChange={setVolume}
              onToggleMute={toggleMute}
              onPlaybackRateChange={setPlaybackRate}
              onToggleFullscreen={toggleFullscreen}
              onTogglePiP={togglePiP}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
