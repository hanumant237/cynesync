/**
 * CineSync Backend — RoomEvents
 *
 * Wires Socket.IO connection + event handlers to the watch-party services.
 * This is the orchestration layer: it validates input, calls RoomManager /
 * UserManager / PlaybackSync, and broadcasts results via SocketManager.
 *
 * Event flow:
 *   client emits → RoomEvents handler → RoomManager/PlaybackSync mutate state
 *     → SocketManager broadcasts room-state + sync to participants
 *
 * Error handling: every handler catches errors, logs them, and emits a
 * structured `watch-party:error` to the offending socket. The server never
 * crashes on a bad event.
 */

import type { Server, Socket } from "socket.io";
import { Logger } from "./Logger.js";
import { RoomManager } from "./RoomManager.js";
import { UserManager } from "./UserManager.js";
import { PlaybackSync } from "./PlaybackSync.js";
import { SocketManager } from "./SocketManager.js";
import type {
  AckResult,
  CreateRoomPayload,
  CreateRoomResult,
  HostChangeSpeedPayload,
  HostChangeVideoPayload,
  HostPlaybackPayload,
  HostSeekPayload,
  JoinRoomPayload,
  JoinRoomResult,
  ParticipantReadyPayload,
  Room,
  SyncPayload,
  WatchPartyError,
  SendMessagePayload,
  TypingPayload,
  ChatMessage,
} from "../types/watchParty.js";

const log = new Logger("RoomEvents");

/** Build a standard ack. */
function ok(): AckResult {
  return { ok: true };
}

/** Build a standard error ack. */
function errAck(error: WatchPartyError): AckResult {
  return { ok: false, error: error.code, message: error.message };
}

export class RoomEvents {
  private readonly log = new Logger("RoomEvents");

  constructor(
    private readonly io: Server,
    private readonly roomManager: RoomManager,
    private readonly userManager: UserManager,
    private readonly playbackSync: PlaybackSync,
    private readonly socketManager: SocketManager,
  ) {}

  /** Register all watch-party handlers on the Socket.IO server. */
  register(): void {
    this.io.on("connection", (socket) => this.handleConnection(socket));
    this.log.info("Watch-party handlers registered");
  }

  /** Wire up events for a newly connected socket. */
  private handleConnection(socket: Socket): void {
    this.log.info("Socket connected", { socketId: socket.id });

    socket.on("watch-party:create-room", (payload, ack) =>
      this.handleCreateRoom(socket, payload, ack),
    );
    socket.on("watch-party:join-room", (payload, ack) =>
      this.handleJoinRoom(socket, payload, ack),
    );
    socket.on("watch-party:leave-room", () => this.handleLeaveRoom(socket));
    socket.on("watch-party:host-play", (payload, ack) =>
      this.handleHostPlay(socket, payload, ack),
    );
    socket.on("watch-party:host-pause", (payload, ack) =>
      this.handleHostPause(socket, payload, ack),
    );
    socket.on("watch-party:host-seek", (payload, ack) =>
      this.handleHostSeek(socket, payload, ack),
    );
    socket.on("watch-party:host-change-speed", (payload, ack) =>
      this.handleHostChangeSpeed(socket, payload, ack),
    );
    socket.on("watch-party:host-change-video", (payload, ack) =>
      this.handleHostChangeVideo(socket, payload, ack),
    );
    socket.on("watch-party:participant-ready", (payload) =>
      this.handleParticipantReady(socket, payload),
    );
    socket.on("watch-party:send-message", (payload, ack) =>
      this.handleSendMessage(socket, payload, ack),
    );
    socket.on("watch-party:typing", (payload) =>
      this.handleTyping(socket, payload),
    );
    socket.on("watch-party:stop-typing", (payload) =>
      this.handleStopTyping(socket, payload),
    );
    socket.on("disconnect", (reason) => this.handleDisconnect(socket, reason));
    socket.on("error", (error) => {
      this.log.error("Socket error", { socketId: socket.id, error: String(error) });
    });
  }

  // -------------------------------------------------------------------------
  // create-room
  // -------------------------------------------------------------------------

  private handleCreateRoom(
    socket: Socket,
    payload: CreateRoomPayload,
    ack: (res: CreateRoomResult) => void,
  ): void {
    try {
      const validation = this.validateCreatePayload(payload);
      if (!validation.ok) {
        ack({ ...errAck(validation.error) });
        return;
      }

      const result = this.roomManager.createRoom(
        socket.id,
        payload.username,
        payload.videoUrl,
      );
      if (!result.ok) {
        ack(errAck(result.error));
        return;
      }

      const room = result.value;
      this.socketManager.joinRoom(socket, room.code);
      log.info("Room created", { code: room.code, host: payload.username });

      ack({ ok: true, room: this.snapshot(room) });
    } catch (error) {
      this.handleUnexpected(socket, "create-room", error, ack);
    }
  }

  // -------------------------------------------------------------------------
  // join-room
  // -------------------------------------------------------------------------

  private handleJoinRoom(
    socket: Socket,
    payload: JoinRoomPayload,
    ack: (res: JoinRoomResult) => void,
  ): void {
    try {
      const validation = this.validateJoinPayload(payload);
      if (!validation.ok) {
        ack({ ...errAck(validation.error) });
        return;
      }

      const result = this.roomManager.joinRoom(
        socket.id,
        payload.code,
        payload.username,
      );
      if (!result.ok) {
        ack(errAck(result.error));
        return;
      }

      const room = result.value;
      this.socketManager.joinRoom(socket, room.code);
      const participant = room.participants.get(socket.id)!;

      // Notify everyone else that a participant joined.
      this.socketManager.broadcastParticipantJoined(room, participant);

      // Broadcast a system chat message: "X joined."
      this.socketManager.broadcastSystemMessage(room, `${participant.username} joined.`);

      // Send the joiner the current room state + an initial sync anchored to now.
      this.socketManager.sendRoomState(socket, room);
      this.sendInitialSync(socket, room);

      log.info("Participant joined", {
        code: room.code,
        username: participant.username,
        participants: room.participants.size,
      });

      ack({ ok: true, room: this.snapshot(room) });
    } catch (error) {
      this.handleUnexpected(socket, "join-room", error, ack);
    }
  }

  // -------------------------------------------------------------------------
  // leave-room
  // -------------------------------------------------------------------------

  private handleLeaveRoom(socket: Socket): void {
    try {
      const result = this.roomManager.leaveRoom(socket.id);
      if (!result.ok) {
        this.socketManager.sendError(socket, result.error);
        return;
      }

      const { room, participant, newHostSocketId } = result.value;
      this.socketManager.leaveRoom(socket, room.code);

      // If the room was destroyed (empty), nothing more to do.
      if (room.participants.size === 0) return;

      // Broadcast a system chat message: "X left."
      this.socketManager.broadcastSystemMessage(room, `${participant.username} left.`);

      // Notify remaining participants.
      this.socketManager.broadcastParticipantDisconnected(room, {
        socketId: socket.id,
        username: participant.username,
        newHostSocketId,
      });
      this.socketManager.broadcastRoomState(room);

      log.info("Participant left", {
        code: room.code,
        username: participant.username,
        remaining: room.participants.size,
      });
    } catch (error) {
      this.handleUnexpected(socket, "leave-room", error);
    }
  }

  // -------------------------------------------------------------------------
  // host-play / host-pause / host-seek / host-change-speed / host-change-video
  // -------------------------------------------------------------------------

  private handleHostPlay(
    socket: Socket,
    payload: HostPlaybackPayload,
    ack: (res: AckResult) => void,
  ): void {
    try {
      const guard = this.requireHost(socket, payload.code, ack);
      if (!guard) return;
      const { room } = guard;

      const playback = this.playbackSync.applyPlay(room, payload.position);
      this.emitSync(socket, room, "play", playback);
      // System message: "Playback resumed."
      const hostUsername = room.participants.get(socket.id)?.username ?? "Host";
      this.socketManager.broadcastSystemMessage(room, `${hostUsername} resumed playback.`);
      ack(ok());
    } catch (error) {
      this.handleUnexpected(socket, "host-play", error, ack);
    }
  }

  private handleHostPause(
    socket: Socket,
    payload: HostPlaybackPayload,
    ack: (res: AckResult) => void,
  ): void {
    try {
      const guard = this.requireHost(socket, payload.code, ack);
      if (!guard) return;
      const { room } = guard;

      const playback = this.playbackSync.applyPause(room, payload.position);
      this.emitSync(socket, room, "pause", playback);
      // System message: "Playback paused."
      const hostUsername = room.participants.get(socket.id)?.username ?? "Host";
      this.socketManager.broadcastSystemMessage(room, `${hostUsername} paused playback.`);
      ack(ok());
    } catch (error) {
      this.handleUnexpected(socket, "host-pause", error, ack);
    }
  }

  private handleHostSeek(
    socket: Socket,
    payload: HostSeekPayload,
    ack: (res: AckResult) => void,
  ): void {
    try {
      const guard = this.requireHost(socket, payload.code, ack);
      if (!guard) return;
      const { room } = guard;

      const playback = this.playbackSync.applySeek(room, payload.position);
      this.emitSync(socket, room, "seek", playback);
      ack(ok());
    } catch (error) {
      this.handleUnexpected(socket, "host-seek", error, ack);
    }
  }

  private handleHostChangeSpeed(
    socket: Socket,
    payload: HostChangeSpeedPayload,
    ack: (res: AckResult) => void,
  ): void {
    try {
      const guard = this.requireHost(socket, payload.code, ack);
      if (!guard) return;
      const { room } = guard;

      if (!this.playbackSync.isValidSpeed(payload.speed)) {
        ack({
          ok: false,
          error: "INVALID_PAYLOAD",
          message: `Speed must be between 0.25 and 4.`,
        });
        return;
      }

      const playback = this.playbackSync.applySpeed(room, payload.speed);
      this.emitSync(socket, room, "speed", playback);
      ack(ok());
    } catch (error) {
      this.handleUnexpected(socket, "host-change-speed", error, ack);
    }
  }

  private handleHostChangeVideo(
    socket: Socket,
    payload: HostChangeVideoPayload,
    ack: (res: AckResult) => void,
  ): void {
    try {
      const guard = this.requireHost(socket, payload.code, ack);
      if (!guard) return;
      const { room } = guard;

      if (!payload.videoUrl || typeof payload.videoUrl !== "string") {
        ack({
          ok: false,
          error: "INVALID_PAYLOAD",
          message: "A video URL is required.",
        });
        return;
      }

      const playback = this.playbackSync.applyVideoChange(room, payload.videoUrl);
      this.emitSync(socket, room, "video", playback, room.videoUrl);
      // Also broadcast the full room state since the video URL changed.
      this.socketManager.broadcastRoomState(room);
      ack(ok());
    } catch (error) {
      this.handleUnexpected(socket, "host-change-video", error, ack);
    }
  }

  // -------------------------------------------------------------------------
  // participant-ready
  // -------------------------------------------------------------------------

  private handleParticipantReady(socket: Socket, payload: ParticipantReadyPayload): void {
    try {
      if (!payload?.code) return;
      const room = this.roomManager.getRoom(payload.code);
      if (!room) {
        this.socketManager.sendError(socket, {
          code: "ROOM_NOT_FOUND",
          message: `Room ${payload.code} was not found.`,
        });
        return;
      }
      // Send an initial sync anchored to the current server time.
      this.sendInitialSync(socket, room);
      log.debug("Participant ready", { code: room.code, socketId: socket.id });
    } catch (error) {
      this.handleUnexpected(socket, "participant-ready", error);
    }
  }

  // -------------------------------------------------------------------------
  // disconnect
  // -------------------------------------------------------------------------

  private handleDisconnect(socket: Socket, reason: string): void {
    try {
      const result = this.roomManager.leaveRoom(socket.id);
      if (!result.ok) {
        log.debug("Socket disconnected (was not in a room)", {
          socketId: socket.id,
          reason,
        });
        return;
      }

      const { room, participant, newHostSocketId } = result.value;
      log.info("Participant disconnected", {
        code: room.code,
        username: participant.username,
        reason,
        remaining: room.participants.size,
      });

      // If the room was destroyed (empty), nothing more to do.
      if (room.participants.size === 0) return;

      // Broadcast a system chat message: "X disconnected."
      this.socketManager.broadcastSystemMessage(room, `${participant.username} disconnected.`);

      // Notify remaining participants.
      this.socketManager.broadcastParticipantDisconnected(room, {
        socketId: socket.id,
        username: participant.username,
        newHostSocketId,
      });
      this.socketManager.broadcastRoomState(room);
    } catch (error) {
      log.error("Error during disconnect handling", {
        socketId: socket.id,
        error: String(error),
      });
    }
  }

  // -------------------------------------------------------------------------
  // Chat: send-message / typing / stop-typing
  // -------------------------------------------------------------------------

  private handleSendMessage(
    socket: Socket,
    payload: SendMessagePayload,
    ack: (res: AckResult) => void,
  ): void {
    try {
      const ctx = this.roomManager.getParticipant(socket.id);
      if (!ctx) {
        ack({ ok: false, error: "NOT_IN_ROOM", message: "You are not in a room." });
        return;
      }
      const { room, participant } = ctx;

      const text = (payload.text ?? "").trim();
      if (!text) {
        ack({ ok: false, error: "INVALID_PAYLOAD", message: "Message cannot be empty." });
        return;
      }
      if (text.length > 500) {
        ack({ ok: false, error: "INVALID_PAYLOAD", message: "Message is too long (500 char max)." });
        return;
      }

      const message: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "user",
        text,
        username: participant.username,
        socketId: socket.id,
        timestamp: Date.now(),
      };

      this.socketManager.broadcastChatMessage(room, message);
      log.info("Chat message", { code: room.code, username: participant.username });
      ack(ok());
    } catch (error) {
      this.handleUnexpected(socket, "send-message", error, ack);
    }
  }

  private handleTyping(socket: Socket, payload: TypingPayload): void {
    try {
      const ctx = this.roomManager.getParticipant(socket.id);
      if (!ctx) return;
      const { room } = ctx;
      this.socketManager.broadcastTyping(room, payload, socket.id);
    } catch (error) {
      this.handleUnexpected(socket, "typing", error);
    }
  }

  private handleStopTyping(socket: Socket, payload: TypingPayload): void {
    try {
      const ctx = this.roomManager.getParticipant(socket.id);
      if (!ctx) return;
      const { room } = ctx;
      this.socketManager.broadcastStopTyping(room, payload, socket.id);
    } catch (error) {
      this.handleUnexpected(socket, "stop-typing", error);
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Require that the socket is the host of the specified room. Emits an error
   * ack + returns undefined if not. Returns the room context on success.
   */
  private requireHost(
    socket: Socket,
    code: string | undefined,
    ack: (res: AckResult) => void,
  ): { room: Room } | undefined {
    if (!code) {
      ack({ ok: false, error: "INVALID_PAYLOAD", message: "Room code is required." });
      return undefined;
    }
    const room = this.roomManager.getRoom(code);
    if (!room) {
      ack({
        ok: false,
        error: "ROOM_NOT_FOUND",
        message: `Room ${code} was not found.`,
      });
      return undefined;
    }
    if (room.hostSocketId !== socket.id) {
      ack({
        ok: false,
        error: "NOT_HOST",
        message: "Only the host can control playback.",
      });
      return undefined;
    }
    return { room };
  }

  /** Emit a sync payload + room-state broadcast for a host action. */
  private emitSync(
    _socket: Socket,
    room: Room,
    action: SyncPayload["action"],
    playback: Room["playback"],
    videoUrl?: string,
  ): void {
    const payload: SyncPayload = { action, playback, videoUrl };
    this.socketManager.broadcastSync(room, payload);
    this.socketManager.broadcastRoomState(room);
  }

  /** Send a joining/re-syncing participant the current playback anchored to now. */
  private sendInitialSync(socket: Socket, room: Room): void {
    const playback = this.playbackSync.buildSyncSnapshot(room);
    const payload: SyncPayload = {
      action: room.playback.state === "playing" ? "play" : "pause",
      playback,
      videoUrl: room.videoUrl,
    };
    this.socketManager.sendSync(socket, payload);
  }

  /** Validate a create-room payload. */
  private validateCreatePayload(payload: CreateRoomPayload): { ok: true } | { ok: false; error: WatchPartyError } {
    if (!payload || typeof payload !== "object") {
      return { ok: false, error: { code: "INVALID_PAYLOAD", message: "Invalid request." } };
    }
    if (!payload.username || typeof payload.username !== "string") {
      return { ok: false, error: { code: "INVALID_PAYLOAD", message: "A username is required." } };
    }
    if (!payload.videoUrl || typeof payload.videoUrl !== "string") {
      return { ok: false, error: { code: "INVALID_PAYLOAD", message: "A video URL is required." } };
    }
    return { ok: true };
  }

  /** Validate a join-room payload. */
  private validateJoinPayload(payload: JoinRoomPayload): { ok: true } | { ok: false; error: WatchPartyError } {
    if (!payload || typeof payload !== "object") {
      return { ok: false, error: { code: "INVALID_PAYLOAD", message: "Invalid request." } };
    }
    if (!payload.code || typeof payload.code !== "string") {
      return { ok: false, error: { code: "INVALID_PAYLOAD", message: "A room code is required." } };
    }
    if (!payload.username || typeof payload.username !== "string") {
      return { ok: false, error: { code: "INVALID_PAYLOAD", message: "A username is required." } };
    }
    return { ok: true };
  }

  /** Snapshot a room for an ack response. */
  private snapshot(room: Room) {
    return {
      code: room.code,
      hostSocketId: room.hostSocketId,
      participants: [...room.participants.values()],
      videoUrl: room.videoUrl,
      playback: room.playback,
      createdAt: room.createdAt,
    };
  }

  /** Catch-all for unexpected errors — never let a handler crash the server. */
  private handleUnexpected(
    socket: Socket,
    event: string,
    error: unknown,
    ack?: (res: AckResult) => void,
  ): void {
    const message = error instanceof Error ? error.message : String(error);
    log.error("Unexpected error in handler", { event, socketId: socket.id, error: message });
    const watchError: WatchPartyError = {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
    };
    this.socketManager.sendError(socket, watchError);
    ack?.({ ok: false, error: watchError.code, message: watchError.message });
  }
}
