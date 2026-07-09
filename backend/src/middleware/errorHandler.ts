/**
 * CineSync Backend — Error Handler Middleware
 *
 * Central error-to-JSON mapper. Express routes throw/next() typed errors;
 * this converts them into the structured `ErrorBody` contract and never lets
 * the server crash. Unknown errors get a generic 500 so internals aren't
 * leaked.
 */

import type { ErrorRequestHandler, Request, RequestHandler } from "express";
import { Logger } from "../services/Logger.js";
import { VideoServiceError } from "../services/VideoService.js";
import type { ErrorBody } from "../types/index.js";

const log = new Logger("ErrorHandler");

/** 404 handler — no route matched. */
export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ErrorBody = {
    code: "NOT_FOUND",
    message: `No route for ${req.method} ${req.path}.`,
  };
  res.status(404).json(body);
};

/** Final error handler. Must have 4 args for Express to recognize it. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = (req as Request & { requestId?: string }).requestId;

  // Known, classified service errors.
  if (err instanceof VideoServiceError) {
    log.warn("Service error", { requestId, code: err.code, message: err.message });
    const body: ErrorBody = {
      code: err.code,
      message: err.message,
      details: err.details,
    };
    res.status(err.status).json(body);
    return;
  }

  // Fallback for anything unexpected — never leak internals.
  log.error("Unhandled error", {
    requestId,
    name: err.name,
    message: err.message,
  });
  const body: ErrorBody = {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
  };
  res.status(500).json(body);
};
