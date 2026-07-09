/**
 * CineSync — Player Utilities & Constants
 *
 * Centralizes every "magic number" and reusable helper for the media player.
 * Components and hooks import from here so values are never hardcoded inline.
 */

import type { UrlValidationResult } from "@/types/player";

/**
 * All numeric tunables for the player. Centralized so they can be adjusted in
 * one place and are never scattered as magic numbers across components.
 */
export const PLAYER_CONSTANTS = {
  /** Seconds skipped by the left/right arrow shortcuts. */
  SEEK_SKIP_SECONDS: 10,
  /** Idle time before the control bar auto-hides while playing. */
  AUTO_HIDE_CONTROLS_MS: 3000,
  /** Volume increment used by keyboard / slider nudging. */
  VOLUME_STEP: 0.05,
  /** Minimum volume (0 = silent). */
  MIN_VOLUME: 0,
  /** Maximum volume (1 = loudest). */
  MAX_VOLUME: 1,
  /** Volume used on first load. */
  DEFAULT_VOLUME: 1,
  /** Playback rate used on first load. */
  DEFAULT_PLAYBACK_RATE: 1,
  /** Transition duration (ms) for control fade animations. */
  CONTROL_TRANSITION_MS: 250,
} as const;

/**
 * Available playback rates offered in the speed menu. Kept as a readonly tuple
 * so the menu and the hook share one source of truth.
 */
export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/**
 * Default sample HLS stream used for development & testing. The canonical
 * "Tears of Steel" stream hosted by Mux specifically for hls.js testing —
 * CORS-friendly, single-variant, .ts segments, and extremely reliable across
 * hls.js versions.
 */
export const DEFAULT_SAMPLE_STREAM =
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

/**
 * File extensions the player knows how to handle. `.m3u8` is routed through
 * hls.js (or native HLS on Safari); the rest are played natively by the
 * browser's HTML5 video element.
 */
export const SUPPORTED_VIDEO_EXTENSIONS = [
  ".m3u8",
  ".mp4",
  ".webm",
  ".ogg",
  ".ogv",
  ".mov",
  ".mkv",
] as const;

/**
 * Format a number of seconds as a clock string.
 *  - < 1h  → "m:ss"   (e.g. 75 → "1:15")
 *  - ≥ 1h  → "h:mm:ss" (e.g. 3661 → "1:01:01")
 * Non-finite / negative values resolve to "0:00".
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/**
 * Detect whether a URL points to an HLS manifest. Used to decide between
 * hls.js and native playback.
 */
export function isHlsUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith(".m3u8");
  } catch {
    return url.toLowerCase().includes(".m3u8");
  }
}

/**
 * Validate a user-supplied video URL and return a friendly, actionable
 * message when invalid. This is a UI-level shape check only — it verifies the
 * URL is non-empty and well-formed (http/https). Format detection (which
 * containers/codecs are supported) is delegated to the backend's FFprobe
 * inspection, so the frontend intentionally does NOT reject URLs by extension.
 */
export function validateVideoUrl(raw: string): UrlValidationResult {
  const url = raw.trim();
  if (!url) {
    return {
      valid: false,
      reason: "Please enter a video URL to continue.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      valid: false,
      reason:
        "That doesn't look like a valid URL. Make sure it starts with http:// or https://.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      reason: "Only http and https URLs are supported.",
    };
  }

  return { valid: true };
}
