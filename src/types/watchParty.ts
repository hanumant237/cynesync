/**
 * CineSync — Watch Party Types (frontend)
 *
 * Frontend mirror of the backend's watch-party Socket.IO protocol
 * (see backend/src/types/watchParty.ts). Kept in sync so the UI hook and
 * components share one typed shape with the server. The event names and
 * payload structures MUST match the backend exactly — do not change the
 * protocol here.
 */

/** A single participant in a watch-party room. */
export interface Participant {
  socketId: string;
  username: string;
  isHost: boolean;
  status: "connecting" | "connected" | "disconnected";
  joinedAt: number;
}

/** Whether the room is currently playing or paused. */
export type PlaybackState = "playing" | "paused";

/**
 * The synchronized playback state of a room. Anchored to a server timestamp
 * (`lastUpdatedAt`) so the client can compute the expected current position
 * despite network latency:
 *
 *   if state === "playing":
 *     expectedPosition = position + (now - lastUpdatedAt) / 1000 * speed
 *   else:
 *     expectedPosition = position
 */
export interface PlaybackSyncState {
  position: number;
  state: PlaybackState;
  speed: number;
  lastUpdatedAt: number;
}

/** Read-only room snapshot sent by the server. */
export interface RoomSnapshot {
  code: string;
  hostSocketId: string;
  participants: Participant[];
  videoUrl: string;
  playback: PlaybackSyncState;
  createdAt: number;
}

/** A sync command broadcast to participants after a host action. */
export interface SyncPayload {
  action: "play" | "pause" | "seek" | "speed" | "video";
  playback: PlaybackSyncState;
  videoUrl?: string;
}

export interface ParticipantDisconnectedPayload {
  socketId: string;
  username: string;
  newHostSocketId?: string;
}

// ---------------------------------------------------------------------------
// Chat types (frontend mirror of backend chat protocol)
// ---------------------------------------------------------------------------

/** Type of a chat message — user-generated or system-generated. */
export type ChatMessageType = "user" | "system";

/** A chat message in a watch-party room. */
export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  text: string;
  username?: string;
  socketId?: string;
  timestamp: number;
}

/** Payload for the `send-message` client → server event. */
export interface SendMessagePayload {
  code: string;
  text: string;
}

/** Payload for the `typing` / `stop-typing` events. */
export interface TypingPayload {
  code: string;
  username: string;
}

/** Payload for the `receive-message` server → client event. */
export interface ReceiveMessagePayload {
  message: ChatMessage;
}

/** Machine-readable error codes from the backend. */
export type WatchPartyErrorCode =
  | "ROOM_NOT_FOUND"
  | "DUPLICATE_ROOM"
  | "DUPLICATE_USERNAME"
  | "NOT_HOST"
  | "NOT_IN_ROOM"
  | "ALREADY_IN_ROOM"
  | "INVALID_PAYLOAD"
  | "INTERNAL_ERROR";

/** A structured watch-party error from the backend. */
export interface WatchPartyError {
  code: WatchPartyErrorCode;
  message: string;
}

/** Generic ack result for events that use acknowledgement callbacks. */
export interface AckResult {
  ok: boolean;
  error?: WatchPartyErrorCode;
  message?: string;
}

export interface CreateRoomResult extends AckResult {
  room?: RoomSnapshot;
}

export interface JoinRoomResult extends AckResult {
  room?: RoomSnapshot;
}

// ---------------------------------------------------------------------------
// Client-side UI state
// ---------------------------------------------------------------------------

/**
 * The high-level UI phase of the watch-party page.
 *  - lobby      : showing the create/join room card
 *  - connecting : socket is connecting to the backend
 *  - in-room    : connected and inside a room
 *  - error      : a fatal error occurred (error card shown)
 */
export type WatchPartyPhase = "lobby" | "connecting" | "in-room" | "error";

/**
 * The realtime connection status, shown as an animated indicator.
 *  - connected      : socket is open and synced
 *  - connecting     : socket is establishing the connection
 *  - reconnecting   : socket dropped, attempting to reconnect
 *  - disconnected   : socket is closed (manual or failed)
 */
export type ConnectionStatusKind =
  | "connected"
  | "connecting"
  | "reconnecting"
  | "disconnected";

/**
 * The sync status of the local playback relative to the room.
 *  - synced       : local playback matches the room state
 *  - synchronizing: applying a sync update from the host
 *  - buffering    : the player is buffering (waiting for data)
 *  - disconnected : no realtime connection
 */
export type SyncStatus = "synced" | "synchronizing" | "buffering" | "disconnected";

/**
 * A classified error for the watch-party error UI. `kind` maps to a specific
 * error card; `message` is the human-readable detail.
 */
export interface WatchPartyUiError {
  kind:
    | "room-not-found"
    | "connection-failed"
    | "disconnected"
    | "host-left"
    | "room-closed"
    | "duplicate-username"
    | "not-host"
    | "generic";
  title: string;
  message: string;
  /** Whether the user can retry or should go back to the lobby. */
  retryable: boolean;
}
