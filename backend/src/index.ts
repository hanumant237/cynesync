/**
 * CineSync Backend — Entry Point (placeholder)
 *
 * Boots the Express HTTP server and the Socket.IO realtime server.
 *
 * This foundation phase does NOT implement any business logic, streaming,
 * or socket functionality — it only establishes the structure so future
 * phases can fill in routes, controllers, and socket handlers.
 */

import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config/index.js";
import { rootRouter } from "./routes/index.js";

const app = express();
const httpServer = createServer(app);

// Realtime layer (handlers wired in a future phase).
export const io = new SocketIOServer(httpServer, {
  cors: { origin: config.corsOrigin, methods: ["GET", "POST"] },
});

// HTTP layer.
app.use(express.json());
app.use("/api", rootRouter);

// Health check — useful for the gateway and future orchestration.
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "cinesync-backend" });
});

httpServer.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[CineSync] Backend listening on port ${config.port}`);
});
