/**
 * CineSync Backend — Routes
 *
 * Mounts domain routers under `/api`. The streaming router is wired here and
 * receives the shared VideoService instance.
 */

import { Router } from "express";
import { createStreamRouter } from "./stream.js";
import type { VideoService } from "../services/VideoService.js";

/**
 * Build the root router. Requires the VideoService so every route shares the
 * same session registry and cleanup hooks.
 */
export function createRootRouter(videoService: VideoService): Router {
  const rootRouter = Router();

  rootRouter.use("/stream", createStreamRouter(videoService));

  return rootRouter;
}
