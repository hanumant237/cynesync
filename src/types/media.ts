/**
 * CineSync — Media Types
 *
 * Placeholder types for the media domain. These are intentionally minimal in
 * this foundation phase and will be expanded in future phases (streaming,
 * metadata, transcoding, etc.).
 */

/** A piece of media the user owns or is authorized to access. */
export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  /** Relative or absolute URL to the media source. */
  sourceUrl?: string;
  /** URL to a poster/thumbnail image. */
  posterUrl?: string;
  durationSeconds?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Playback state shared by the player and (future) watch parties. */
export type PlaybackState = "idle" | "playing" | "paused" | "ended";
