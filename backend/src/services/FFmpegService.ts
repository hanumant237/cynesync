/**
 * CineSync Backend — FFmpegService
 *
 * Launches and manages FFmpeg processes that transcode a source URL to an
 * on-the-fly HLS presentation. Also decides whether a source can be played
 * directly by the browser (no transcoding needed).
 *
 * Responsibilities:
 *  - decide direct vs. transcode (canPlayDirectly)
 *  - launch an HLS transcode into a session directory
 *  - resolve the playlist path
 *  - stop the running process for a session
 */

import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { config } from "../config/index.js";
import { Logger } from "./Logger.js";
import type { MediaInfo } from "../types/index.js";

const log = new Logger("FFmpegService");

/** Error thrown when FFmpeg fails in a known, classifiable way. */
export class FFmpegError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "FFmpegError";
  }
}

/**
 * Codec/container combinations modern browsers can play natively without
 * transcoding. MP4/H.264/AAC is the universal baseline; WebM/VP9/Opus is
 * supported in Chromium/Firefox.
 */
const DIRECT_PLAY_CODECS: ReadonlyArray<{
  container: string;
  video: ReadonlySet<string>;
  audio: ReadonlySet<string>;
}> = [
  {
    container: "MP4",
    video: new Set(["h264", "hevc", "av1"]),
    audio: new Set(["aac", "mp3", "ac3", "eac3", "opus"]),
  },
  {
    container: "WebM",
    video: new Set(["vp8", "vp9", "av1"]),
    audio: new Set(["vorbis", "opus"]),
  },
];

/**
 * Decide whether a browser can play the source directly (no FFmpeg needed).
 * Returns true only when both the container AND the primary video/audio codecs
 * are in the direct-play set. HLS sources are also considered direct since the
 * browser (or hls.js) handles them.
 */
export function canPlayDirectly(media: MediaInfo): boolean {
  if (media.container === "HLS") return true;

  const videoCodec = media.video?.codecName;
  const audioCodec = media.audio?.codecName;
  if (!videoCodec) return false;

  for (const profile of DIRECT_PLAY_CODECS) {
    if (media.container !== profile.container) continue;
    if (!profile.video.has(videoCodec)) continue;
    // Audio may be absent (video-only) — that's fine. If present, must match.
    if (audioCodec && !profile.audio.has(audioCodec)) continue;
    return true;
  }
  return false;
}

/** Result of launching an HLS transcode. */
export interface HlsLaunchResult {
  /** Absolute path to the generated playlist (.m3u8). */
  playlistPath: string;
  /** A promise that resolves when the playlist exists, or rejects on failure. */
  ready: Promise<void>;
  /** Stop the underlying FFmpeg process. */
  stop: () => void;
  /** The running FFmpeg child process (for cleanup coordination). */
  process: ChildProcess;
}

export class FFmpegService {
  /**
   * Launch an HLS transcode for the given source into `outDir`.
   * The returned `ready` promise resolves once the playlist file exists on
   * disk (meaning segments are being produced and are safe to serve).
   *
   * Handles the case where FFmpeg finishes cleanly (exit code 0) before the
   * poll catches the playlist — common for short sources.
   */
  launchHls(sourceUrl: string, outDir: string, sessionId: string): HlsLaunchResult {
    const playlistPath = `${outDir}/stream.m3u8`;

    const args = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      sourceUrl,

      // Video: H.264 (universal browser support), keep resolution, CRF 23.
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",

      // Audio: AAC 128k.
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ac",
      "2",

      // HLS packaging.
      "-f",
      "hls",
      "-hls_time",
      String(config.hlsSegmentSeconds),
      "-hls_list_size",
      String(config.hlsPlaylistSize),
      "-hls_flags",
      "delete_segments+append_list+omit_endlist",
      "-hls_segment_filename",
      `${outDir}/seg-%05d.ts`,
      playlistPath,
    ];

    log.info("Starting HLS transcode", { sessionId, sourceUrl });

    const child = spawn(config.ffmpegPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stderrBuffer = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderrBuffer += chunk.toString();
    });

    child.on("error", (err) => {
      const e = err as NodeJS.ErrnoException;
      if (e.code === "ENOENT") {
        log.error("FFmpeg binary not found", { path: config.ffmpegPath });
      } else {
        log.error("Failed to spawn FFmpeg", { sessionId, error: e.message });
      }
    });

    child.on("exit", (code, signal) => {
      log.info("FFmpeg exited", { sessionId, code, signal });
    });

    // `ready` resolves once the playlist exists. Settle-guarded so it can only
    // resolve or reject once even if poll + exit race.
    let settled = false;
    let readyResolve!: () => void;
    let readyReject!: (err: Error) => void;
    const ready = new Promise<void>((resolve, reject) => {
      readyResolve = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      readyReject = (err) => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      };
    });

    const resolveIfPlaylistExists = () => {
      if (existsSync(playlistPath)) {
        clearInterval(poll);
        clearTimeout(startupTimer);
        log.info("HLS playlist ready", { sessionId, playlistPath });
        readyResolve();
        return true;
      }
      return false;
    };

    const startupTimer = setTimeout(() => {
      readyReject(
        new FFmpegError(
          "FFMPEG_TIMEOUT",
          "FFmpeg took too long to start producing segments.",
          { sessionId },
        ),
      );
    }, config.ffmpegStartupTimeoutMs);

    // On exit: if FFmpeg finished cleanly (code 0) and the playlist exists,
    // resolve (handles short sources that finish before the poll catches them).
    // Otherwise reject with a classified error.
    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      clearTimeout(startupTimer);
      clearInterval(poll);
      if (code === 0 && existsSync(playlistPath)) {
        resolveIfPlaylistExists();
        return;
      }
      readyReject(
        new FFmpegError(
          "FFMPEG_FAILED",
          `FFmpeg exited unexpectedly (code ${code}, signal ${signal}).`,
          { sessionId, stderr: stderrBuffer.slice(-500) },
        ),
      );
    };
    child.once("exit", onExit);

    const stop = () => {
      clearTimeout(startupTimer);
      clearInterval(poll);
      child.removeListener("exit", onExit);
      if (!child.killed && child.exitCode === null) {
        // SIGTERM lets FFmpeg flush + close files cleanly.
        child.kill("SIGTERM");
        // Hard-kill fallback if it doesn't exit promptly.
        setTimeout(() => {
          if (!child.killed && child.exitCode === null) {
            child.kill("SIGKILL");
          }
        }, 3000);
      }
    };

    // Poll for the playlist file. FFmpeg creates it once the first segment is
    // written, which is the moment the browser can start loading.
    const poll = setInterval(() => {
      resolveIfPlaylistExists();
    }, 200);

    return { playlistPath, ready, stop, process: child };
  }
}
