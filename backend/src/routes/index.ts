/**
 * CineSync Backend — Routes
 *
 * Mounts domain routers under `/api`. In this foundation phase there are no
 * concrete routes; future phases will add media, watch-party, and settings
 * routers here.
 */

import { Router } from "express";

export const rootRouter = Router();

// TODO (future phase): mount domain routers, e.g.
//   rootRouter.use("/media", mediaRouter);
//   rootRouter.use("/watch-parties", watchPartyRouter);
//   rootRouter.use("/settings", settingsRouter);
