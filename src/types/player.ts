/**
 * CineSync — Player Types
 *
 * Shared types for the media player. Used by the player hook and all player
 * UI components so the contract between them is explicit and typed.
 */

/**
 * The high-level status of the player. Each value maps to a distinct UI:
 *  - idle       : no source loaded yet (shows a placeholder / hint)
 *  - loading    : a source is being loaded (manifest parsing, etc.)
 *  - playing    : playback is active
 *  - paused     : playback is paused
 *  - buffering  : playback is waiting for more data (spinner)
 *  - ended      : the source finished playing (replay affordance)
 *  - error      : playback failed (error overlay with retry)
 */
export type PlayerStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

/**
 * Result of validating a user-supplied video URL. `reason` is a friendly,
 * human-readable message shown in the UI when invalid.
 */
export type UrlValidationResult =
  | { valid: true }
  | { valid: false; reason: string };
