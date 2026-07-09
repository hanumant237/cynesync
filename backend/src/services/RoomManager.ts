/**
 * CineSync Backend — RoomManager
 *
 * Owns the watch-party room registry. Handles the full room lifecycle:
 *  - create room (generates a unique short code, creator becomes host)
 *  - join room (validates code + username uniqueness)
 *  - leave room (removes participant, migrates or destroys host)
 *  - destroy empty rooms (manual + automatic reaper)
 *  - host migration (when the host disconnects, the next-oldest participant
 *    becomes host)
 *
 * RoomManager is transport-agnostic — it knows nothing about Socket.IO. The
 * RoomEvents service bridges sockets to room operations.
 */

import { customAlphabet } from "nanoid";
import { config } from "../config/index.js";
import { Logger } from "./Logger.js";
import type {
  Participant,
  PlaybackSyncState,
  Room,
  WatchPartyError,
} from "../types/watchParty.js";

const log = new Logger("RoomManager");

/**
 * Room-code alphabet: uppercase letters + digits, excluding ambiguous
 * characters (0/O, 1/I) for shareability.
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Custom nanoid generator scoped to the room-code alphabet + length. */
const generateCode = customAlphabet(
  CODE_ALPHABET,
  config.watchPartyCodeLength,
);

/** Result of a room operation that may succeed or fail. */
export type RoomOpResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: WatchPartyError };

/** Build a fresh playback state (paused at 0, speed 1). */
function initialPlayback(): PlaybackSyncState {
  return {
    position: 0,
    state: "paused",
    speed: 1,
    lastUpdatedAt: Date.now(),
  };
}

export class RoomManager {
  /** All active rooms, keyed by room code. */
  private rooms = new Map<string, Room>();
  /** Reverse index: socket id → room code, for fast lookup on disconnect. */
  private socketToRoom = new Map<string, string>();
  /** Reaper timer handle. */
  private reaper: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Periodically destroy empty rooms that have outlived their TTL.
    this.reaper = setInterval(
      () => this.reapEmptyRooms(),
      config.watchPartyReaperIntervalMs,
    );
    this.reaper.unref?.();
  }

  /** Create a new room. The creator becomes the host. */
  createRoom(
    hostSocketId: string,
    username: string,
    videoUrl: string,
  ): RoomOpResult<Room> {
    // A socket can only be in one room at a time.
    if (this.socketToRoom.has(hostSocketId)) {
      return {
        ok: false,
        error: {
          code: "ALREADY_IN_ROOM",
          message: "You are already in a room. Leave it before creating another.",
        },
      };
    }

    const code = this.generateUniqueCode();
    const now = Date.now();
    const host: Participant = {
      socketId: hostSocketId,
      username: this.normalizeUsername(username),
      isHost: true,
      status: "connected",
      joinedAt: now,
    };

    const room: Room = {
      code,
      hostSocketId,
      participants: new Map([[hostSocketId, host]]),
      videoUrl,
      playback: initialPlayback(),
      createdAt: now,
      lastActivityAt: now,
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(hostSocketId, code);
    log.info("Room created", { code, host: host.username, videoUrl });
    return { ok: true, value: room };
  }

  /** Join an existing room by code. */
  joinRoom(
    socketId: string,
    code: string,
    username: string,
  ): RoomOpResult<Room> {
    if (this.socketToRoom.has(socketId)) {
      return {
        ok: false,
        error: {
          code: "ALREADY_IN_ROOM",
          message: "You are already in a room. Leave it before joining another.",
        },
      };
    }

    const room = this.rooms.get(code.toUpperCase());
    if (!room) {
      return {
        ok: false,
        error: { code: "ROOM_NOT_FOUND", message: `Room ${code} was not found.` },
      };
    }

    const normalizedUsername = this.normalizeUsername(username);
    const duplicate = [...room.participants.values()].some(
      (p) => p.username.toLowerCase() === normalizedUsername.toLowerCase(),
    );
    if (duplicate) {
      return {
        ok: false,
        error: {
          code: "DUPLICATE_USERNAME",
          message: `The username "${normalizedUsername}" is already taken in this room.`,
        },
      };
    }

    const now = Date.now();
    const participant: Participant = {
      socketId,
      username: normalizedUsername,
      isHost: false,
      status: "connected",
      joinedAt: now,
    };

    room.participants.set(socketId, participant);
    this.socketToRoom.set(socketId, room.code);
    room.lastActivityAt = now;
    log.info("Participant joined", {
      code: room.code,
      username: normalizedUsername,
      participants: room.participants.size,
    });
    return { ok: true, value: room };
  }

  /** Remove a participant from their room. Returns the room + whether a host
   *  migration occurred (and the new host's socket id). */
  leaveRoom(socketId: string): RoomOpResult<{
    room: Room;
    newHostSocketId?: string;
    participant: Participant;
  }> {
    const code = this.socketToRoom.get(socketId);
    if (!code) {
      return {
        ok: false,
        error: { code: "NOT_IN_ROOM", message: "You are not in a room." },
      };
    }
    const room = this.rooms.get(code)!;
    const participant = room.participants.get(socketId);
    if (!participant) {
      this.socketToRoom.delete(socketId);
      return {
        ok: false,
        error: { code: "NOT_IN_ROOM", message: "You are not in a room." },
      };
    }

    room.participants.delete(socketId);
    this.socketToRoom.delete(socketId);
    log.info("Participant left", {
      code: room.code,
      username: participant.username,
      remaining: room.participants.size,
    });

    // Destroy the room if empty.
    if (room.participants.size === 0) {
      this.destroyRoom(room.code);
      return { ok: true, value: { room, participant } };
    }

    // Migrate host if needed.
    let newHostSocketId: string | undefined;
    if (room.hostSocketId === socketId) {
      newHostSocketId = this.migrateHost(room);
    }

    room.lastActivityAt = Date.now();
    return { ok: true, value: { room, participant, newHostSocketId } };
  }

  /** Get a room by code. */
  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  /** Get the room a socket is currently in. */
  getRoomBySocket(socketId: string): Room | undefined {
    const code = this.socketToRoom.get(socketId);
    return code ? this.rooms.get(code) : undefined;
  }

  /** Get the participant for a socket id within a specific room. */
  getParticipant(socketId: string): { room: Room; participant: Participant } | undefined {
    const room = this.getRoomBySocket(socketId);
    if (!room) return undefined;
    const participant = room.participants.get(socketId);
    return participant ? { room, participant } : undefined;
  }

  /** Explicitly destroy a room. */
  destroyRoom(code: string): void {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return;
    for (const socketId of room.participants.keys()) {
      this.socketToRoom.delete(socketId);
    }
    this.rooms.delete(code.toUpperCase());
    log.info("Room destroyed", { code });
  }

  /** Destroy all rooms (used on server shutdown). */
  disposeAll(): void {
    if (this.reaper) {
      clearInterval(this.reaper);
      this.reaper = null;
    }
    const count = this.rooms.size;
    this.rooms.clear();
    this.socketToRoom.clear();
    log.info("All rooms disposed", { count });
  }

  /** Destroy empty rooms that have been idle longer than the TTL. */
  private reapEmptyRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      // Only reap rooms with zero participants.
      if (room.participants.size > 0) continue;
      const idleMs = now - room.lastActivityAt;
      if (idleMs > config.watchPartyEmptyRoomTtlMs) {
        this.destroyRoom(code);
      }
    }
  }

  /**
   * Migrate the host role to the next-oldest participant. Returns the new
   * host's socket id, or undefined if the room is empty (caller should destroy).
   */
  private migrateHost(room: Room): string | undefined {
    if (room.participants.size === 0) return undefined;
    // Pick the participant who joined earliest.
    let oldest: Participant | undefined;
    for (const p of room.participants.values()) {
      if (!oldest || p.joinedAt < oldest.joinedAt) {
        oldest = p;
      }
    }
    if (!oldest) return undefined;
    oldest.isHost = true;
    room.hostSocketId = oldest.socketId;
    log.info("Host migrated", { code: room.code, newHost: oldest.username });
    return oldest.socketId;
  }

  /** Generate a room code not currently in use. */
  private generateUniqueCode(): string {
    for (let attempt = 0; attempt < 50; attempt++) {
      const code = generateCode();
      if (!this.rooms.has(code)) return code;
    }
    // Extremely unlikely fallback — append a random suffix.
    return generateCode() + generateCode().charAt(0);
  }

  /** Trim + guard the username. */
  private normalizeUsername(username: string): string {
    return (username ?? "").trim().slice(0, 32) || "Guest";
  }
}

// Re-exported error codes (as a set) for callers that want to match codes.
export const ROOM_ERROR_CODES = {
  ROOM_NOT_FOUND: "ROOM_NOT_FOUND",
  DUPLICATE_USERNAME: "DUPLICATE_USERNAME",
  NOT_IN_ROOM: "NOT_IN_ROOM",
  ALREADY_IN_ROOM: "ALREADY_IN_ROOM",
} as const;
