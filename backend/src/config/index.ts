/**
 * CineSync Backend — Application Configuration
 *
 * Loads environment variables and exposes a single typed `config` object.
 * Every tunable lives here so there are no magic numbers elsewhere.
 */

import dotenv from "dotenv";

dotenv.config();

/** Parse a positive integer env var with a fallback. */
function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  /** Port the Express + Socket.IO server listens on. */
  port: intEnv("PORT", 4001),
  /** Comma-separated list of allowed CORS origins. */
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(","),
  /** Directory containing media the user owns or is authorized to access. */
  mediaRoot: process.env.MEDIA_ROOT ?? "./media",
  /** Node environment. */
  nodeEnv: process.env.NODE_ENV ?? "development",

  /** Directory for on-the-fly HLS transcoding output. */
  hlsOutputDir: process.env.HLS_OUTPUT_DIR ?? "./.hls-tmp",
  /** Idle TTL (ms) before an HLS session is reaped. */
  hlsSessionTtlMs: intEnv("HLS_SESSION_TTL_MS", 30 * 60 * 1000),
  /** FFmpeg binary path. */
  ffmpegPath: process.env.FFMPEG_PATH ?? "ffmpeg",
  /** FFprobe binary path. */
  ffprobePath: process.env.FFPROBE_PATH ?? "ffprobe",
  /** Max time (ms) for ffprobe inspection. */
  ffprobeTimeoutMs: intEnv("FFPROBE_TIMEOUT_MS", 30_000),
  /** Max time (ms) to wait for the first HLS segment. */
  ffmpegStartupTimeoutMs: intEnv("FFMPEG_STARTUP_TIMEOUT_MS", 20_000),
  /** HLS segment duration in seconds. */
  hlsSegmentSeconds: intEnv("HLS_SEGMENT_SECONDS", 6),
  /** Number of segments to retain in the HLS sliding window. */
  hlsPlaylistSize: intEnv("HLS_PLAYLIST_SIZE", 6),
  /** HTTP timeout (ms) for remote URL reachability checks. */
  urlProbeTimeoutMs: intEnv("URL_PROBE_TIMEOUT_MS", 10_000),
  /** Log level. */
  logLevel: (process.env.LOG_LEVEL ?? "info") as
    | "silly"
    | "debug"
    | "info"
    | "warn"
    | "error",

  // ---------------------------------------------------------------------------
  // Watch Party (realtime sync)
  // ---------------------------------------------------------------------------

  /** Length of generated room codes (e.g. 6 → "ABCD12"). */
  watchPartyCodeLength: intEnv("WATCH_PARTY_CODE_LENGTH", 6),
  /** How long (ms) an empty room persists before being destroyed. */
  watchPartyEmptyRoomTtlMs: intEnv("WATCH_PARTY_EMPTY_ROOM_TTL_MS", 5 * 60 * 1000),
  /** Interval (ms) between empty-room reaper sweeps. */
  watchPartyReaperIntervalMs: intEnv("WATCH_PARTY_REAPER_INTERVAL_MS", 60_000),
  /** Interval (ms) between periodic sync broadcasts to each room. */
  watchPartySyncIntervalMs: intEnv("WATCH_PARTY_SYNC_INTERVAL_MS", 10_000),
  /** Maximum allowed playback speed multiplier. */
  watchPartyMaxSpeed: 4,
  /** Minimum allowed playback speed multiplier. */
  watchPartyMinSpeed: 0.25,
  /** Allowed discrete playback speeds. */
  watchPartyAllowedSpeeds: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3, 4],
} as const;

export type AppConfig = typeof config;
