/**
 * CineSync Backend — SocketManager
 *
 * A thin typed wrapper around the Socket.IO server. Provides:
 *  - typed emit helpers (so event names + payloads are checked at compile time)
 *  - room-scoped broadcast helpers (emit to everyone in a watch-party room)
 *  - single-socket emit helpers (for acks and targeted errors)
 *
 * Centralizing all socket I/O here keeps RoomEvents focused on orchestration
 * and makes the transport layer easy to mock in tests.
 */

import type { Server, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  RoomSnapshot,
  Participant,
  SyncPayload,
  ParticipantDisconnectedPayload,
  WatchPartyError,
  ChatMessage,
  TypingPayload,
  ReceiveMessagePayload,
} from "../types/watchParty.js";
import { toRoomSnapshot } from "../types/watchParty.js";
import type { Room } from "../types/watchParty.js";

export class SocketManager {
  constructor(private readonly io: Server) {}

  /** Broadcast the authoritative room state to every participant in a room. */
  broadcastRoomState(room: Room): void {
    const snapshot: RoomSnapshot = toRoomSnapshot(room);
    this.io.to(room.code).emit("watch-party:room-state", snapshot);
  }

  /** Broadcast a sync command (play/pause/seek/speed/video) to a room. */
  broadcastSync(room: Room, payload: SyncPayload): void {
    this.io.to(room.code).emit("watch-party:sync", payload);
  }

  /** Notify a room that a participant joined (excluding the joiner). */
  broadcastParticipantJoined(room: Room, participant: Participant): void {
    // Emit to everyone in the room EXCEPT the new participant.
    room.participants.forEach((p) => {
      if (p.socketId !== participant.socketId) {
        this.io.to(p.socketId).emit("watch-party:participant-joined", participant);
      }
    });
  }

  /** Notify a room that a participant disconnected. */
  broadcastParticipantDisconnected(
    room: Room,
    payload: ParticipantDisconnectedPayload,
  ): void {
    this.io.to(room.code).emit("watch-party:participant-disconnected", payload);
  }

  /** Send a room-state snapshot to a single socket (e.g. on join). */
  sendRoomState(socket: Socket, room: Room): void {
    socket.emit("watch-party:room-state", toRoomSnapshot(room));
  }

  /** Send a sync payload to a single socket (e.g. on participant-ready). */
  sendSync(socket: Socket, payload: SyncPayload): void {
    socket.emit("watch-party:sync", payload);
  }

  /** Send an error to a single socket. */
  sendError(socket: Socket, error: WatchPartyError): void {
    socket.emit("watch-party:error", error);
  }

  // -------------------------------------------------------------------------
  // Chat broadcast helpers
  // -------------------------------------------------------------------------

  /** Broadcast a chat message to every participant in a room. */
  broadcastChatMessage(room: Room, message: ChatMessage): void {
    const payload: ReceiveMessagePayload = { message };
    this.io.to(room.code).emit("watch-party:receive-message", payload);
  }

  /** Broadcast a system chat message (join/leave/play/pause notices). */
  broadcastSystemMessage(room: Room, text: string): void {
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "system",
      text,
      timestamp: Date.now(),
    };
    this.broadcastChatMessage(room, message);
  }

  /** Broadcast a typing indicator to a room (excluding the typing user). */
  broadcastTyping(room: Room, payload: TypingPayload, exceptSocketId?: string): void {
    room.participants.forEach((p) => {
      if (p.socketId !== exceptSocketId) {
        this.io.to(p.socketId).emit("watch-party:typing", payload);
      }
    });
  }

  /** Broadcast a stop-typing indicator to a room (excluding the user). */
  broadcastStopTyping(room: Room, payload: TypingPayload, exceptSocketId?: string): void {
    room.participants.forEach((p) => {
      if (p.socketId !== exceptSocketId) {
        this.io.to(p.socketId).emit("watch-party:stop-typing", payload);
      }
    });
  }

  /** Have a socket join a Socket.IO room (so it receives room broadcasts). */
  joinRoom(socket: Socket, roomCode: string): void {
    void socket.join(roomCode);
  }

  /** Have a socket leave a Socket.IO room. */
  leaveRoom(socket: Socket, roomCode: string): void {
    void socket.leave(roomCode);
  }
}

/**
 * Type guard helper: narrow a Socket.IO server to one that uses our typed
 * events. The actual runtime server is untyped; this just bridges it.
 */
export function asTypedServer(io: Server): Server<never, ServerToClientEvents> {
  return io as unknown as Server<never, ServerToClientEvents>;
}
