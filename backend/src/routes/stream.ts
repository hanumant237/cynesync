/**
 * CineSync Backend — Stream Routes
 *
 * Mounts the streaming endpoints. Receives a configured VideoService (built
 * once at startup) so all handlers share one instance and its session
 * registry.
 *
 *   POST /api/stream                       — prepare a source for playback
 *   GET  /api/stream/:id/playlist.m3u8     — HLS playlist for a session
 *   GET  /api/stream/:id/segments/:name    — HLS segment for a session
 */

import { Router } from "express";
import {
  createPlaylistHandler,
  createSegmentHandler,
  createStreamHandler,
} from "../controllers/streamController.js";
import type { VideoService } from "../services/VideoService.js";

export function createStreamRouter(videoService: VideoService): Router {
  const router = Router();

  router.post("/", createStreamHandler(videoService));
  router.get("/:id/playlist.m3u8", createPlaylistHandler(videoService));
  router.get("/:id/segments/:name", createSegmentHandler(videoService));

  return router;
}
