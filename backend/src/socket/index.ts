/**
 * CineSync Backend — Socket.IO Layer
 *
 * Initializes the watch-party synchronization engine: wires the Socket.IO
 * server to the RoomManager / UserManager / PlaybackSync / SocketManager via
 * the RoomEvents orchestrator.
 *
 * `initWatchParty` is called once at startup from index.ts with the
 * already-created `io` instance. It returns the RoomManager so the server
 * can dispose all rooms on shutdown.
 */

import type { Server } from "socket.io";
import { RoomManager } from "../services/RoomManager.js";
import { UserManager } from "../services/UserManager.js";
import { PlaybackSync } from "../services/PlaybackSync.js";
import { SocketManager } from "../services/SocketManager.js";
import { RoomEvents } from "../services/RoomEvents.js";
import { Logger } from "../services/Logger.js";

const log = new Logger("SocketLayer");

/**
 * Initialize the watch-party engine. Wires all handlers and returns the
 * RoomManager so the caller can dispose rooms on shutdown.
 */
export function initWatchParty(io: Server): RoomManager {
  const roomManager = new RoomManager();
  const userManager = new UserManager(roomManager);
  const playbackSync = new PlaybackSync();
  const socketManager = new SocketManager(io);
  const roomEvents = new RoomEvents(
    io,
    roomManager,
    userManager,
    playbackSync,
    socketManager,
  );

  roomEvents.register();
  log.info("Watch-party engine initialized");

  return roomManager;
}
