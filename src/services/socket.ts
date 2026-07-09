/**
 * CineSync — Socket.IO Client (Placeholder)
 *
 * Provides a single, lazily-initialized Socket.IO client for realtime
 * features (watch-party sync, presence, etc.). This foundation phase does
 * NOT implement any socket functionality — it only wires up the structure
 * so future phases can call `getSocket()` and start emitting/listening.
 *
 * Connection goes through the gateway using the XTransformPort query
 * parameter convention (see project README).
 */

import { io, type Socket } from "socket.io-client";
import { BACKEND_PORT, SOCKET_BASE_URL } from "@/utils/constants";

let socket: Socket | null = null;

/**
 * Return the shared Socket.IO client, creating it on first use.
 * Disabled by default in this phase to avoid connecting without a backend.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  // Construct a gateway-friendly URL. The path is always "/" and the target
  // backend port is passed via the XTransformPort query parameter.
  const url = `${SOCKET_BASE_URL}/?XTransformPort=${BACKEND_PORT}`;

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
