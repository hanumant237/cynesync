/**
 * CineSync Backend — Stream Controller
 *
 * Request handlers for the streaming API. Thin layer: validates input, calls
 * VideoService, and shapes the JSON response. All errors are forwarded to the
 * centralized error handler via next().
 */

import type { NextFunction, Request, Response } from "express";
import { Logger } from "../services/Logger.js";
import { VideoService, VideoServiceError } from "../services/VideoService.js";
import { validateUrl, probeUrl } from "../utils/url.js";
import type { ErrorBody, StreamSession } from "../types/index.js";

const log = new Logger("StreamController");

/**
 * POST /stream
 * Body: { "url": "https://..." }
 *
 * Validates the URL, probes reachability + content-type, inspects with
 * FFprobe, and returns a StreamSession describing how to play the source
 * (direct URL or generated HLS playlist URL).
 */
export function createStreamHandler(videoService: VideoService) {
  return async function streamHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const rawUrl = req.body?.url;
      log.info("Stream request", { url: rawUrl });

      // 1. Shape validation.
      const validation = validateUrl(rawUrl);
      if (!validation.ok) {
        const body: ErrorBody = {
          code: validation.code ?? "INVALID_URL",
          message: validation.reason ?? "Invalid URL.",
        };
        res.status(400).json(body);
        return;
      }

      // 2. Reachability + content-type probe.
      const probe = await probeUrl(validation.url!);
      if (!probe.reachable) {
        const body: ErrorBody = {
          code: probe.code ?? "UNREACHABLE_URL",
          message: probe.reason ?? "The URL could not be reached.",
          details: { status: probe.status, contentType: probe.contentType },
        };
        res.status(probe.code === "URL_TIMEOUT" ? 504 : 502).json(body);
        return;
      }
      if (!probe.looksLikeVideo) {
        const body: ErrorBody = {
          code: "UNSUPPORTED_FORMAT",
          message:
            "The URL does not appear to point to a video. Expected a video Content-Type or a recognized video file extension.",
          details: { contentType: probe.contentType, status: probe.status },
        };
        res.status(415).json(body);
        return;
      }

      // 3. Inspect + prepare (direct or HLS transcode).
      const session: StreamSession = await videoService.prepareStream(validation.url!);

      log.info("Stream ready", {
        id: session.id,
        strategy: session.strategy,
        container: session.media.container,
      });

      res.status(200).json(session);
    } catch (err) {
      // VideoServiceError carries its own status; let the handler map it.
      if (err instanceof VideoServiceError) {
        next(err);
        return;
      }
      next(
        new VideoServiceError(
          "INTERNAL_ERROR",
          "An unexpected error occurred while preparing the stream.",
          500,
          { error: (err as Error).message },
        ),
      );
    }
  };
}

/**
 * GET /stream/:id/playlist.m3u8
 * Serves the HLS playlist for a transcode session. Sets the correct
 * Content-Type so hls.js / Safari pick it up.
 */
export function createPlaylistHandler(videoService: VideoService) {
  return function playlistHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const { id } = req.params;
    const playlistPath = videoService.getPlaylistPath(id);
    if (!playlistPath) {
      const body: ErrorBody = {
        code: "SESSION_NOT_FOUND",
        message: "This stream session does not exist or has expired.",
      };
      res.status(404).json(body);
      return;
    }
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(playlistPath, (err) => {
      if (err) {
        log.warn("Failed to send playlist", { id, error: err.message });
        next(err);
      }
    });
  };
}

/**
 * GET /stream/:id/segments/:name
 * Serves a single HLS segment (.ts) for a session. The service validates the
 * segment name stays within the session directory (no path traversal).
 */
export function createSegmentHandler(videoService: VideoService) {
  return function segmentHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const { id, name } = req.params;
    const segmentPath = videoService.getSegmentPath(id, name);
    if (!segmentPath) {
      const body: ErrorBody = {
        code: "SEGMENT_NOT_FOUND",
        message: "This segment does not exist or the session has expired.",
      };
      res.status(404).json(body);
      return;
    }
    res.setHeader("Content-Type", "video/mp2t");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.sendFile(segmentPath, (err) => {
      if (err) {
        log.warn("Failed to send segment", { id, name, error: err.message });
        next(err);
      }
    });
  };
}
