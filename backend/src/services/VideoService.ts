/**
 * CineSync Backend — VideoService
 *
 * Orchestrates the streaming workflow:
 *  1. inspect the source via MediaInspector
 *  2. decide direct vs. transcode (FFmpegService.canPlayDirectly)
 *  3. for direct: return the source URL as-is
 *  4. for transcode: launch FFmpeg HLS into a temp dir, register with
 *     CleanupService, and return the playlist URL
 *
 * Keeps a registry of active HLS sessions so the controller can serve
 * playlists/segments and the cleanup service can reap them.
 */

import { mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { nanoid } from "nanoid";
import { config } from "../config/index.js";
import { Logger } from "./Logger.js";
import { MediaInspector, InspectionError } from "./MediaInspector.js";
import { FFmpegService, canPlayDirectly, FFmpegError } from "./FFmpegService.js";
import { CleanupService } from "./CleanupService.js";
import type { MediaInfo, StreamSession, StreamStrategy } from "../types/index.js";

const log = new Logger("VideoService");

/** Error thrown by VideoService with a machine-readable code. */
export class VideoServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "VideoServiceError";
  }
}

/** Internal record for an active HLS session. */
interface ActiveSession {
  session: StreamSession;
  /** Absolute path to the session's HLS output directory. */
  outDir: string;
  /** Stop the FFmpeg process. */
  stop: () => void;
  lastActivity: number;
}

export class VideoService {
  private active = new Map<string, ActiveSession>();
  private readonly outRoot: string;

  constructor(
    private readonly inspector = new MediaInspector(),
    private readonly ffmpeg = new FFmpegService(),
    private readonly cleanup = new CleanupService(),
  ) {
    this.outRoot = resolve(config.hlsOutputDir);
    if (!existsSync(this.outRoot)) {
      mkdirSync(this.outRoot, { recursive: true });
    }
    log.info("HLS output root", { path: this.outRoot });
  }

  /** Expose the cleanup service so the server can dispose on shutdown. */
  get cleanupService(): CleanupService {
    return this.cleanup;
  }

  /**
   * Inspect a source URL and prepare it for browser playback.
   * Returns a StreamSession describing how the browser should play it.
   */
  async prepareStream(sourceUrl: string): Promise<StreamSession> {
    log.info("Preparing stream", { sourceUrl });

    // 1. Inspect.
    let media: MediaInfo;
    try {
      media = await this.inspector.inspect(sourceUrl);
    } catch (err) {
      throw this.mapInspectionError(err);
    }

    // 2. Decide strategy.
    const strategy: StreamStrategy = canPlayDirectly(media) ? "direct" : "hls";
    log.info("Strategy chosen", { strategy, container: media.container });

    const id = nanoid();
    const createdAt = new Date().toISOString();

    if (strategy === "direct") {
      const session: StreamSession = {
        id,
        sourceUrl,
        strategy,
        media,
        directUrl: sourceUrl,
        createdAt,
      };
      log.info("Direct stream ready", { id, url: sourceUrl });
      return session;
    }

    // 3. Transcode to HLS.
    const outDir = join(this.outRoot, id);
    mkdirSync(outDir, { recursive: true });

    let launch;
    try {
      launch = this.ffmpeg.launchHls(sourceUrl, outDir, id);
    } catch (err) {
      await this.cleanup.removeDir(outDir);
      throw new VideoServiceError(
        "FFMPEG_FAILED",
        "Failed to start the streaming engine.",
        500,
        { error: (err as Error).message },
      );
    }

    // Register with cleanup so the process + dir are tracked & reaped.
    this.cleanup.register({
      id,
      outDir,
      stop: launch.stop,
      lastActivity: Date.now(),
    });

    // Wait for the playlist to exist before responding.
    try {
      await launch.ready;
    } catch (err) {
      await this.cleanup.dispose(id);
      throw this.mapFFmpegError(err);
    }

    const session: StreamSession = {
      id,
      sourceUrl,
      strategy,
      media,
      hlsPlaylistUrl: `/api/stream/${id}/playlist.m3u8`,
      createdAt,
    };

    this.active.set(id, {
      session,
      outDir,
      stop: launch.stop,
      lastActivity: Date.now(),
    });

    log.info("HLS stream ready", { id, playlist: session.hlsPlaylistUrl });
    return session;
  }

  /** Resolve the absolute playlist path for a session, if active. */
  getPlaylistPath(id: string): string | undefined {
    const s = this.active.get(id);
    if (!s) return undefined;
    s.lastActivity = Date.now();
    this.cleanup.touch(id);
    return join(s.outDir, "stream.m3u8");
  }

  /** Resolve an absolute segment path for a session, if active. */
  getSegmentPath(id: string, segmentName: string): string | undefined {
    const s = this.active.get(id);
    if (!s) return undefined;
    s.lastActivity = Date.now();
    this.cleanup.touch(id);
    // Only allow files inside this session's directory.
    const safe = join(s.outDir, segmentName);
    if (!safe.startsWith(s.outDir)) return undefined;
    return safe;
  }

  /** Stop and remove a session immediately. */
  async disposeSession(id: string): Promise<void> {
    this.active.delete(id);
    await this.cleanup.dispose(id);
  }

  /** Map an InspectionError to a VideoServiceError with an HTTP status. */
  private mapInspectionError(err: unknown): VideoServiceError {
    if (err instanceof InspectionError) {
      const status =
        err.code === "FFPROBE_MISSING" ? 500 : err.code === "INSPECTION_TIMEOUT" ? 504 : 422;
      return new VideoServiceError(err.code, err.message, status, err.details);
    }
    return new VideoServiceError(
      "INSPECTION_FAILED",
      "Failed to inspect the media.",
      500,
      { error: (err as Error).message },
    );
  }

  /** Map an FFmpegError to a VideoServiceError with an HTTP status. */
  private mapFFmpegError(err: unknown): VideoServiceError {
    if (err instanceof FFmpegError) {
      const status = err.code === "FFMPEG_MISSING" ? 500 : err.code === "FFMPEG_TIMEOUT" ? 504 : 500;
      return new VideoServiceError(err.code, err.message, status, err.details);
    }
    return new VideoServiceError(
      "FFMPEG_FAILED",
      "The streaming engine encountered an error.",
      500,
      { error: (err as Error).message },
    );
  }
}
