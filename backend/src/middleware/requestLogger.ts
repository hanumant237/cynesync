/**
 * CineSync Backend — Request Logging Middleware
 *
 * Logs every incoming request with method, path, and a short id. Response
 * time is logged on finish so slow endpoints are easy to spot.
 */

import type { Request, RequestHandler } from "express";
import { nanoid } from "nanoid";
import { Logger } from "../services/Logger.js";

const log = new Logger("HTTP");

export const requestLogger: RequestHandler = (req, res, next) => {
  const requestId = nanoid(8);
  const start = Date.now();

  (req as Request & { requestId?: string }).requestId = requestId;

  res.on("finish", () => {
    const ms = Date.now() - start;
    log.info("request", {
      id: requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms,
    });
  });

  next();
};
