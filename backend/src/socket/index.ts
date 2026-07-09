/**
 * CineSync Backend — Socket.IO Layer
 *
 * Realtime event handlers for watch-party sync, presence, and (future)
 * voice chat. This foundation phase does NOT implement any socket
 * functionality — it only exposes the shared `io` instance and a placeholder
 * registration hook.
 */

import type { Server as SocketIOServer } from "socket.io";

/**
 * Register socket event handlers. Called once at startup in a future phase.
 */
export function registerSocketHandlers(_io: SocketIOServer): void {
  // TODO (future phase): handle "join-room", "play", "pause", "seek", ...
}
