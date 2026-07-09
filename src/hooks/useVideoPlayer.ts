"use client";

/**
 * CineSync — useVideoPlayer
 *
 * The core media-player hook. Owns the <video> element, drives hls.js for
 * adaptive streaming, exposes fully-typed playback state, and wires up:
 *  - playback state machine (loading / playing / paused / buffering / ended / error)
 *  - buffered-progress tracking
 *  - volume + mute
 *  - playback rate
 *  - fullscreen + Picture-in-Picture
 *  - auto-hiding controls
 *  - keyboard shortcuts (Space, ←, →, F, M)
 *
 * UI components consume the returned value; the hook contains no markup so it
 * stays testable and reusable.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import type { PlayerStatus } from "@/types/player";
import {
  PLAYER_CONSTANTS,
  PLAYBACK_RATES,
  isHlsUrl,
} from "@/utils/player";

/** Everything the player UI needs to render and interact. */
export interface UseVideoPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  status: PlayerStatus;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isPiP: boolean;
  controlsVisible: boolean;
  errorMessage: string;
  hasSource: boolean;
  loadSource: (url: string) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  skip: (deltaSeconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleFullscreen: () => void;
  togglePiP: () => void;
  retry: () => void;
  /** Force the control bar to reveal (e.g. on mouse move). */
  revealControls: () => void;
}

/** Element tags that should NOT trigger player shortcuts while focused. */
const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** True when the active element is a form field (so shortcuts are skipped). */
function isTypingTarget(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  return TYPING_TAGS.has(el.tagName);
}

export function useVideoPlayer(): UseVideoPlayerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolumeState] = useState<number>(PLAYER_CONSTANTS.DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(
    PLAYER_CONSTANTS.DEFAULT_PLAYBACK_RATE,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ------------------------------------------------------------------
  // Controls auto-hide
  // ------------------------------------------------------------------

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    clearHideTimer();
  }, [clearHideTimer]);

  const scheduleHideControls = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, PLAYER_CONSTANTS.AUTO_HIDE_CONTROLS_MS);
  }, [clearHideTimer]);

  // ------------------------------------------------------------------
  // hls.js teardown
  // ------------------------------------------------------------------

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  // ------------------------------------------------------------------
  // Source loading
  // ------------------------------------------------------------------

  const loadSource = useCallback(
    (url: string) => {
      const video = videoRef.current;
      if (!video) return;

      sourceUrlRef.current = url;
      setErrorMessage("");
      setStatus("loading");
      setCurrentTime(0);
      setDuration(0);
      setBuffered(0);

      // Reset any previous source / hls instance.
      destroyHls();
      video.removeAttribute("src");
      video.load();

      const useHls = isHlsUrl(url);

      if (useHls) {
        // hls.js is loaded dynamically so it stays client-only and out of the
        // initial bundle. We prefer hls.js when supported (all non-Safari
        // browsers) and only fall back to native HLS on Safari. Checking
        // `canPlayType` first is unreliable — some Chromium builds report
        // "maybe" for HLS but cannot actually play it.
        import("hls.js")
          .then(({ default: Hls }) => {
            if (Hls.isSupported()) {
              // `enableWorker: false` keeps hls.js on the main thread. Web
              // Workers can fail to resolve in some sandboxed/headless
              // environments; the main-thread path is the most reliable for a
              // dev/test player and has no practical downside at this scale.
              const hls = new Hls({ enableWorker: false });
              hlsRef.current = hls;
              hls.attachMedia(video);
              hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                hls.loadSource(url);
              });
              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                void video.play().catch(() => {
                  /* autoplay may be blocked — user can press play */
                });
              });
              hls.on(Hls.Events.ERROR, (_event, data) => {
                if (!data.fatal) return;
                // Attempt a single graceful recovery before surfacing an error.
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    destroyHls();
                    setErrorMessage(
                      data.details
                        ? `Playback error: ${data.details}.`
                        : "Playback failed. Please try again.",
                    );
                    setStatus("error");
                    break;
                }
              });
              return;
            }

            // Native HLS (Safari / iOS).
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
              video.src = url;
              void video.play().catch(() => {
                /* autoplay may be blocked — user can press play */
              });
              return;
            }

            setErrorMessage("HLS playback is not supported in this browser.");
            setStatus("error");
          })
          .catch(() => {
            setErrorMessage("Failed to load the streaming engine.");
            setStatus("error");
          });
        return;
      }

      // Native HTML5 video (mp4 / webm / mov / …).
      video.src = url;
      void video.play().catch(() => {
        /* autoplay may be blocked — user can press play */
      });
    },
    [destroyHls],
  );

  // ------------------------------------------------------------------
  // Playback actions
  // ------------------------------------------------------------------

  const play = useCallback(() => {
    void videoRef.current?.play().catch(() => {
      /* ignored — state stays in sync via events */
    });
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(time)) return;
    const clamped = Math.max(0, Math.min(time, video.duration || 0));
    video.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  const skip = useCallback(
    (deltaSeconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      seek(video.currentTime + deltaSeconds);
    },
    [seek],
  );

  const setVolume = useCallback((next: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(
      PLAYER_CONSTANTS.MIN_VOLUME,
      Math.min(next, PLAYER_CONSTANTS.MAX_VOLUME),
    );
    video.volume = clamped;
    // Unmute when the user raises volume above zero.
    if (clamped > PLAYER_CONSTANTS.MIN_VOLUME && video.muted) {
      video.muted = false;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
  }, []);

  // ------------------------------------------------------------------
  // Fullscreen
  // ------------------------------------------------------------------

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void el.requestFullscreen().catch(() => undefined);
    }
  }, []);

  // ------------------------------------------------------------------
  // Picture-in-Picture
  // ------------------------------------------------------------------

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch {
      /* PiP unavailable or blocked — ignore */
    }
  }, []);

  // ------------------------------------------------------------------
  // Retry
  // ------------------------------------------------------------------

  const retry = useCallback(() => {
    if (sourceUrlRef.current) {
      loadSource(sourceUrlRef.current);
    }
  }, [loadSource]);

  // ------------------------------------------------------------------
  // Wire up <video> element events
  // ------------------------------------------------------------------

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => setDuration(video.duration || 0);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onTimeUpdate = () => setCurrentTime(video.currentTime || 0);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onPlay = () => {
      setStatus("playing");
      scheduleHideControls();
    };
    const onPause = () => {
      // Ignore the pause that fires when buffering — 'waiting' handles that.
      if (video.readyState < 3) return;
      setStatus("paused");
      revealControls();
    };
    const onWaiting = () => {
      if (!video.ended) setStatus("buffering");
    };
    const onPlaying = () => setStatus("playing");
    const onCanPlay = () => {
      if (video.paused) setStatus("paused");
      else setStatus("playing");
    };
    const onEnded = () => {
      setStatus("ended");
      revealControls();
    };
    const onVolumeChange = () => {
      setVolumeState(video.volume);
      setMuted(video.muted);
    };
    const onRateChange = () => setPlaybackRateState(video.playbackRate);
    const onError = () => {
      setErrorMessage(
        "This video couldn't be played. Check the URL or try a different source.",
      );
      setStatus("error");
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("progress", onProgress);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("ended", onEnded);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("ratechange", onRateChange);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("ratechange", onRateChange);
      video.removeEventListener("error", onError);
    };
  }, [revealControls, scheduleHideControls]);

  // ------------------------------------------------------------------
  // Fullscreen + PiP change listeners
  // ------------------------------------------------------------------

  useEffect(() => {
    const onFullscreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    const video = videoRef.current;
    video?.addEventListener("enterpictureinpicture", onEnterPiP);
    video?.addEventListener("leavepictureinpicture", onLeavePiP);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      video?.removeEventListener("enterpictureinpicture", onEnterPiP);
      video?.removeEventListener("leavepictureinpicture", onLeavePiP);
    };
  }, []);

  // ------------------------------------------------------------------
  // Cleanup hls on unmount
  // ------------------------------------------------------------------

  useEffect(() => {
    return () => {
      destroyHls();
      clearHideTimer();
    };
  }, [destroyHls, clearHideTimer]);

  // ------------------------------------------------------------------
  // Keyboard shortcuts (Space / ← / → / F / M)
  // ------------------------------------------------------------------

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Never intercept while typing in a form field, or with modifiers.
      if (isTypingTarget() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!sourceUrlRef.current) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          revealControls();
          if (videoRef.current && !videoRef.current.paused) {
            scheduleHideControls();
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-PLAYER_CONSTANTS.SEEK_SKIP_SECONDS);
          revealControls();
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(PLAYER_CONSTANTS.SEEK_SKIP_SECONDS);
          revealControls();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          revealControls();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    togglePlay,
    skip,
    toggleFullscreen,
    toggleMute,
    revealControls,
    scheduleHideControls,
  ]);

  // Sync the playback-rate menu's default into the video once on mount.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = PLAYER_CONSTANTS.DEFAULT_VOLUME;
      videoRef.current.playbackRate = PLAYER_CONSTANTS.DEFAULT_PLAYBACK_RATE;
    }
  }, []);

  return {
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
    hasSource: sourceUrlRef.current !== null,
    loadSource,
    togglePlay,
    play,
    pause,
    seek,
    skip,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleFullscreen,
    togglePiP,
    retry,
    revealControls,
  };
}

/**
 * Speeds offered in the playback-rate menu. Re-exported from the hook module
 * for convenience so the menu and hook stay in sync.
 */
export { PLAYBACK_RATES };
