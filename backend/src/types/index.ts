/**
 * CineSync Backend — Shared Types
 *
 * Type definitions shared across the backend streaming engine. Kept in one
 * place so controllers, services, and the error handler share one contract.
 */

/** A single codec stream detected by FFprobe (video or audio). */
export interface CodecStream {
  /** "video" | "audio" | "subtitle" | ... */
  codecType: string;
  /** Short codec name, e.g. "h264", "aac", "vp9". */
  codecName: string;
  /** Human-readable codec long name. */
  codecLongName?: string;
  /** Width in pixels (video only). */
  width?: number;
  /** Height in pixels (video only). */
  height?: number;
  /** Average bitrate in bits/sec, when reported. */
  bitRate?: number;
  /** Frame rate as a string, e.g. "30000/1001". */
  frameRate?: string;
  /** Number of audio channels (audio only). */
  channels?: number;
  /** Sample rate in Hz (audio only). */
  sampleRate?: number;
}

/** Normalized media metadata produced by MediaInspector. */
export interface MediaInfo {
  /** Source URL that was inspected. */
  sourceUrl: string;
  /** Container/format short name, e.g. "mov,mp4,m4a,3gp,3g2,mj2". */
  formatName: string;
  /** Human-readable format long name. */
  formatLongName?: string;
  /** Normalized container label for display, e.g. "MP4", "MKV". */
  container: string;
  /** Total duration in seconds. */
  durationSeconds: number;
  /** Overall bitrate in bits/sec. */
  bitRate?: number;
  /** File size in bytes, when known. */
  size?: number;
  /** Detected codec streams (video, audio, subtitles, ...). */
  streams: CodecStream[];
  /** Primary video stream, if any. */
  video?: CodecStream;
  /** Primary audio stream, if any. */
  audio?: CodecStream;
  /** Best-effort width (px) of the primary video stream. */
  width?: number;
  /** Best-effort height (px) of the primary video stream. */
  height?: number;
  /** Resolution label, e.g. "1080p", "720p". */
  resolution?: string;
}

/**
 * Strategy chosen by VideoService for how the browser should play the source.
 *  - direct     : the browser can play the original URL as-is
 *  - hls        : transcode on the fly to HLS via FFmpeg
 */
export type StreamStrategy = "direct" | "hls";

/** Stream session returned by POST /stream. */
export interface StreamSession {
  /** Unique session id. */
  id: string;
  /** Original source URL. */
  sourceUrl: string;
  /** Chosen playback strategy. */
  strategy: StreamStrategy;
  /** Inspected media metadata. */
  media: MediaInfo;
  /** When direct: the URL the browser should load. */
  directUrl?: string;
  /** When hls: the URL to the generated HLS playlist. */
  hlsPlaylistUrl?: string;
  /** ISO timestamp the session was created. */
  createdAt: string;
}

/** Structured error body returned by all error paths. */
export interface ErrorBody {
  /** Machine-readable error code, e.g. "INVALID_URL". */
  code: string;
  /** Human-readable, actionable message. */
  message: string;
  /** Optional extra context for debugging. */
  details?: unknown;
}
