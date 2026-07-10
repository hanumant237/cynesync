/**
 * CineSync — Socket.IO Client (Placeholder)
 *
 * Provides a single, lazily-initialized Socket.IO client for realtime
 * features (watch-party sync, presence, etc.). Connects directly to the
 * backend server without gateway routing.
 */

import { io, type Socket } from "socket.io-client";
import { BACKEND_URL } from "@/utils/constants";

let socket: Socket | null = null;

/**
 * Return the shared Socket.IO client, creating it on first use.
 * Connects directly to the backend server.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  // Connect directly to the backend server
  const url = BACKEND_URL;

  socket = io(url, {
    autoConnect: false,
    reconnection: true,
  });

  return socket;
}

/** Disconnect and tear down the current socket (useful for tests/HMR). */
export function disposeSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
