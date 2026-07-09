"use client";

/**
 * CineSync — useStreamPreparation
 *
 * Orchestrates the stream-preparation lifecycle: validates the URL, calls the
 * backend's POST /stream, and exposes a typed state machine that the PlayerPage
 * renders as loading messages → player handoff → error card.
 *
 * States: idle → preparing → detecting → (transcoding) → ready | error
 *
 * The "detecting" and "transcoding" phases are shown as animated messages while
 * the single POST /stream request is in flight (the backend does FFprobe
 * inspection + HLS startup within that one request). When the response arrives,
 * the state advances to "ready" and the resolved playback URL is handed to the
 * VideoPlayer.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { prepareStream, buildPlaybackUrl, mapStreamError } from "@/services/stream";
import type { PrepareState, StreamError, StreamSession } from "@/types/stream";

/** Loading message shown for each preparing sub-state. */
const PREPARE_MESSAGES: Readonly<Record<Exclude<PrepareState, "idle" | "error">, string>> = {
  preparing: "Preparing video…",
  detecting: "Detecting format…",
  transcoding: "Starting stream…",
  ready: "Ready…",
};

export interface UseStreamPreparationReturn {
  /** Current preparation lifecycle state. */
  state: PrepareState;
  /** Human-readable message for the current preparing state (empty when idle/error). */
  message: string;
  /** The resolved playback URL the player should load (set when state === "ready"). */
  playbackUrl: string | null;
  /** The backend session info (for metadata display), or null. */
  session: StreamSession | null;
  /** Friendly error info when state === "error". */
  error: StreamError | null;
  /** Begin preparing a stream for the given URL. */
  prepare: (url: string) => void;
  /** Reset back to idle, clearing any session/error. */
  reset: () => void;
}

export function useStreamPreparation(): UseStreamPreparationReturn {
  const [state, setState] = useState<PrepareState>("idle");
  const [session, setSession] = useState<StreamSession | null>(null);
  const [error, setError] = useState<StreamError | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  // Track the active request so a late response from a previous submission
  // doesn't overwrite a newer one.
  const activeRequestRef = useRef<number>(0);
  // Track timers for the staged loading messages so they can be cleaned up.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const reset = useCallback(() => {
    activeRequestRef.current += 1;
    clearTimers();
    setState("idle");
    setSession(null);
    setError(null);
    setPlaybackUrl(null);
  }, [clearTimers]);

  const prepare = useCallback(
    (url: string) => {
      const requestId = ++activeRequestRef.current;
      clearTimers();
      setError(null);
      setSession(null);
      setPlaybackUrl(null);
      setState("preparing");

      // Stage 2: after a short beat, show "Detecting format…" (the backend is
      // running FFprobe during the request).
      timersRef.current.push(
        setTimeout(() => {
          if (activeRequestRef.current !== requestId) return;
          setState("detecting");
        }, 600),
      );

      // Kick off the backend request.
      prepareStream(url)
        .then((result) => {
          if (activeRequestRef.current !== requestId) return;

          // Transition to the "ready" state and hand the playback URL to the
          // player. If the backend chose transcoding, briefly show "Starting
          // stream…" before handing off.
          const transitionToReady = () => {
            if (activeRequestRef.current !== requestId) return;
            setState("ready");
            setSession(result);
            setPlaybackUrl(buildPlaybackUrl(result));
          };

          if (result.strategy === "hls") {
            setState("transcoding");
            timersRef.current.push(
              setTimeout(() => {
                if (activeRequestRef.current !== requestId) return;
                transitionToReady();
              }, 700),
            );
          } else {
            transitionToReady();
          }
        })
        .catch((err) => {
          if (activeRequestRef.current !== requestId) return;
          clearTimers();
          setError(mapStreamError(err));
          setState("error");
        });
    },
    [clearTimers],
  );

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      activeRequestRef.current += 1;
      clearTimers();
    };
  }, [clearTimers]);

  const message =
    state === "idle" || state === "error" ? "" : PREPARE_MESSAGES[state];

  return {
    state,
    message,
    playbackUrl,
    session,
    error,
    prepare,
    reset,
  };
}
