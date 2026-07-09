/**
 * CineSync Backend — UserManager
 *
 * Tracks participants across all watch-party rooms. Maintains the reverse
 * index from socket id → participant so disconnect handlers can clean up
 * efficiently without scanning every room.
 *
 * The RoomManager owns the authoritative participant records inside each
 * Room; UserManager is a thin lookup/cache layer that makes socket-driven
 * events (especially disconnect) O(1).
 */

import type { Participant, Room } from "../types/watchParty.js";
import type { RoomManager } from "./RoomManager.js";

export class UserManager {
  constructor(private readonly roomManager: RoomManager) {}

  /** Look up the participant + room for a socket id. */
  getBySocketId(socketId: string): { room: Room; participant: Participant } | undefined {
    return this.roomManager.getParticipant(socketId);
  }

  /** Is this socket the host of its room? */
  isHost(socketId: string): boolean {
    const ctx = this.roomManager.getParticipant(socketId);
    return Boolean(ctx?.participant.isHost);
  }

  /** List all participants in a room (as an array). */
  listParticipants(room: Room): Participant[] {
    return [...room.participants.values()];
  }

  /** Count participants in a room. */
  count(room: Room): number {
    return room.participants.size;
  }
}
