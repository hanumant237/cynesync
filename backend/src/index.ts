/**
 * CineSync Backend — Entry Point
 *
 * Boots the Express HTTP server, mounts the streaming routes, initializes the
 * watch-party Socket.IO engine, and wires up graceful shutdown so FFmpeg
 * processes are stopped, temp files removed, and all rooms disposed when the
 * server stops — never leaving anything behind.
 */

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config/index.js";
import { Logger } from "./services/Logger.js";
import { VideoService } from "./services/VideoService.js";
import { createRootRouter } from "./routes/index.js";
import { requestLogger, errorHandler, notFoundHandler } from "./middleware/index.js";
import { initWatchParty } from "./socket/index.js";
import type { RoomManager } from "./services/RoomManager.js";

const log = new Logger("Server");

// --- Build the singleton services -------------------------------------------
const videoService = new VideoService();

// --- Express app ------------------------------------------------------------
const app = express();
const httpServer = createServer(app);

// Realtime layer.
// When CORS_ORIGIN is "*", allow all origins (development); otherwise use the
// explicit list. Socket.IO expects `origin: true` for wildcard support.
const corsOrigin =
  config.corsOrigin.length === 1 && config.corsOrigin[0] === "*"
    ? true
    : config.corsOrigin;
export const io = new SocketIOServer(httpServer, {
  cors: { origin: corsOrigin, methods: ["GET", "POST"] },
});

// Initialize the watch-party synchronization engine (registers all socket
// handlers). Returns the RoomManager so we can dispose rooms on shutdown.
const roomManager: RoomManager = initWatchParty(io);

app.use(requestLogger);
app.use(cors({ origin: corsOrigin, methods: ["GET", "POST"] }));
app.use(express.json({ limit: "1mb" }));

// Health check — useful for the gateway and orchestration.
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "cinesync-backend", version: "0.3.0" });
});

// Streaming API.
app.use("/api", createRootRouter(videoService));

// 404 + centralized error handler (must be last).
app.use(notFoundHandler);
app.use(errorHandler);

// --- Start ------------------------------------------------------------------
httpServer.listen(config.port, () => {
  log.info("CineSync backend listening", {
    port: config.port,
    nodeEnv: config.nodeEnv,
    hlsOutputDir: config.hlsOutputDir,
  });
});

// --- Graceful shutdown ------------------------------------------------------
let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info("Shutting down", { signal });

  // Stop accepting new connections.
  httpServer.close(() => log.info("HTTP server closed"));

  // Dispose all watch-party rooms.
  roomManager.disposeAll();

  // Stop FFmpeg processes + remove temp dirs.
  await videoService.cleanupService.disposeAll();

  // Close realtime layer.
  io.close(() => log.info("Socket.IO closed"));

  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

// Never crash on an unhandled rejection/exception — log and continue.
process.on("unhandledRejection", (reason) => {
  log.error("Unhandled promise rejection", { reason });
});
process.on("uncaughtException", (err) => {
  log.error("Uncaught exception", { name: err.name, message: err.message });
});
