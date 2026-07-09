/**
 * CineSync — Stream Types (frontend)
 *
 * Frontend mirror of the backend's streaming API contract
 * (see backend/src/types/index.ts). Kept in sync so the player and services
 * share one typed shape for stream sessions, media metadata, and errors.
 */

/** A single codec stream detected by FFprobe (video or audio). */
export interface CodecStream {
  codecType: string;
  codecName: string;
  codecLongName?: string;
  width?: number;
  height?: number;
  bitRate?: number;
  frameRate?: string;
  channels?: number;
  sampleRate?: number;
}

/** Normalized media metadata returned by the backend's FFprobe inspection. */
export interface MediaInfo {
  sourceUrl: string;
  formatName: string;
  formatLongName?: string;
  container: string;
  durationSeconds: number;
  bitRate?: number;
  size?: number;
  streams: CodecStream[];
  video?: CodecStream;
  audio?: CodecStream;
  width?: number;
  height?: number;
  resolution?: string;
}

/**
 * Strategy chosen by the backend for how the browser should play the source.
 *  - direct : the browser can play the original URL as-is
 *  - hls    : transcode on the fly to HLS via FFmpeg
 */
export type StreamStrategy = "direct" | "hls";

/** Stream session returned by POST /stream. */
export interface StreamSession {
  id: string;
  sourceUrl: string;
  strategy: StreamStrategy;
  media: MediaInfo;
  /** When direct: the URL the browser should load. */
  directUrl?: string;
  /** When hls: relative URL to the generated HLS playlist (e.g. /api/stream/:id/playlist.m3u8). */
  hlsPlaylistUrl?: string;
  createdAt: string;
}

/** Structured error body returned by the backend's error paths. */
export interface StreamErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * The preparation lifecycle of a stream, from the moment the user submits a
 * URL to the moment the player can start loading. Each value maps to a
 * distinct UI:
 *  - idle        : no request yet
 *  - preparing   : request sent, waiting for backend ("Preparing video…")
 *  - detecting   : backend is inspecting with FFprobe ("Detecting format…")
 *  - transcoding : backend chose HLS, transcode starting ("Starting stream…")
 *  - ready       : stream is ready, hand off to player
 *  - error       : something failed (error card shown)
 */
export type PrepareState =
  | "idle"
  | "preparing"
  | "detecting"
  | "transcoding"
  | "ready"
  | "error";

/**
 * A friendly, classified error surfaced to the UI. `code` is the machine
 * error code (from the backend when available); `message` is human-readable.
 */
export interface StreamError {
  code: string;
  message: string;
  /** Whether retrying might help (e.g. network blip vs. unsupported format). */
  retryable: boolean;
}
