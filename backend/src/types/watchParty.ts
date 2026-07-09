/**
 * CineSync Backend — Watch Party Types
 *
 * Shared types for the watch-party synchronization engine. Used by the
 * RoomManager, UserManager, PlaybackSync, SocketManager, and RoomEvents
 * services so the contract between them is explicit and typed.
 *
 * Design notes:
 *  - Rooms are identified by a short, shareable code (e.g. "ABCD12").
 *  - The host is the participant who created the room; only they may issue
 *    playback controls. If the host disconnects, host role migrates to the
 *    next-oldest participant (or the room is destroyed if empty).
 *  - Playback state is anchored to a server timestamp so participants can
 *    compute the correct currentTime despite network latency.
 */

/** A single participant in a watch-party room. */
export interface Participant {
  /** Socket.IO socket id. Unique per connection. */
  socketId: string;
  /** Display name chosen by the user. */
  username: string;
  /** Whether this participant is the room host. */
  isHost: boolean;
  /** Connection status. */
  status: "connecting" | "connected" | "disconnected";
  /** Epoch milliseconds when the participant joined the room. */
  joinedAt: number;
}

/** Whether the room is currently playing or paused. */
export type PlaybackState = "playing" | "paused";

/**
 * The synchronized playback state of a room. The `position` is anchored to
 * `lastUpdatedAt` (server epoch ms) so any participant can compute the
 * expected currentTime at the current moment:
 *
 *   if state === "playing":
 *     expectedPosition = position + (now - lastUpdatedAt) / 1000 * speed
 *   else:
 *     expectedPosition = position
 *
 * This latency compensation avoids noticeable desynchronization.
 */
export interface PlaybackSyncState {
  /** Current playback position in seconds (as of `lastUpdatedAt`). */
  position: number;
  /** "playing" or "paused". */
  state: PlaybackState;
  /** Playback speed multiplier (e.g. 1, 1.25, 1.5, 2). */
  speed: number;
  /** Server epoch milliseconds when this state was last updated. */
  lastUpdatedAt: number;
}

/** A watch-party room. */
export interface Room {
  /** Short, shareable room code, e.g. "ABCD12". */
  code: string;
  /** Socket id of the current host. */
  hostSocketId: string;
  /** All participants in the room, keyed by socket id. */
  participants: Map<string, Participant>;
  /** The video URL currently loaded in the room. */
  videoUrl: string;
  /** Synchronized playback state (position, playing/paused, speed, timestamp). */
  playback: PlaybackSyncState;
  /** Epoch milliseconds when the room was created. */
  createdAt: number;
  /** Epoch milliseconds of the last activity (used for idle reaping). */
  lastActivityAt: number;
}

/**
 * Read-only snapshot of a room for serialization over the wire (participants
 * as an array, no Map). Sent to clients in `room-state` events.
 */
export interface RoomSnapshot {
  code: string;
  hostSocketId: string;
  participants: Participant[];
  videoUrl: string;
  playback: PlaybackSyncState;
  createdAt: number;
}

/** Convert a Room into a serializable RoomSnapshot. */
export function toRoomSnapshot(room: Room): RoomSnapshot {
  return {
    code: room.code,
    hostSocketId: room.hostSocketId,
    participants: [...room.participants.values()],
    videoUrl: room.videoUrl,
    playback: room.playback,
    createdAt: room.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Socket event names
// ---------------------------------------------------------------------------

/**
 * Client → Server events. All events are namespaced with a `watch-party:`
 * prefix to avoid collisions with future realtime features.
 */
export type ClientToServerEvents = {
  /** Create a new room. The creator becomes the host. */
  "watch-party:create-room": (payload: CreateRoomPayload, ack: (res: CreateRoomResult) => void) => void;
  /** Join an existing room by code. */
  "watch-party:join-room": (payload: JoinRoomPayload, ack: (res: JoinRoomResult) => void) => void;
  /** Leave the current room (voluntary). */
  "watch-party:leave-room": () => void;
  /** Host: start playback. */
  "watch-party:host-play": (payload: HostPlaybackPayload, ack: (res: AckResult) => void) => void;
  /** Host: pause playback. */
  "watch-party:host-pause": (payload: HostPlaybackPayload, ack: (res: AckResult) => void) => void;
  /** Host: seek to a new position. */
  "watch-party:host-seek": (payload: HostSeekPayload, ack: (res: AckResult) => void) => void;
  /** Host: change playback speed. */
  "watch-party:host-change-speed": (payload: HostChangeSpeedPayload, ack: (res: AckResult) => void) => void;
  /** Host: change the current video URL. */
  "watch-party:host-change-video": (payload: HostChangeVideoPayload, ack: (res: AckResult) => void) => void;
  /** Participant: signal that the player is ready and requesting initial sync. */
  "watch-party:participant-ready": (payload: ParticipantReadyPayload) => void;
};

/**
 * Server → Client events. `room-state` carries the authoritative snapshot;
 * `participant-disconnected` and `participant-joined` are presence updates.
 */
export type ServerToClientEvents = {
  /** Authoritative room state update (broadcast on any change). */
  "watch-party:room-state": (snapshot: RoomSnapshot) => void;
  /** A participant joined the room. */
  "watch-party:participant-joined": (participant: Participant) => void;
  /** A participant left or disconnected. */
  "watch-party:participant-disconnected": (payload: ParticipantDisconnectedPayload) => void;
  /** A playback sync command (play/pause/seek/speed) for participants to apply. */
  "watch-party:sync": (payload: SyncPayload) => void;
  /** An error occurred (sent only to the offending socket). */
  "watch-party:error": (error: WatchPartyError) => void;
};

// ---------------------------------------------------------------------------
// Event payloads
// ---------------------------------------------------------------------------

export interface CreateRoomPayload {
  username: string;
  videoUrl: string;
}

export interface CreateRoomResult extends AckResult {
  room?: RoomSnapshot;
}

export interface JoinRoomPayload {
  code: string;
  username: string;
}

export interface JoinRoomResult extends AckResult {
  room?: RoomSnapshot;
}

/** Base payload for host playback events. */
export interface HostPlaybackPayload {
  code: string;
  /** Current position when the action was taken (seconds). */
  position: number;
}

export interface HostSeekPayload {
  code: string;
  /** Target position in seconds. */
  position: number;
}

export interface HostChangeSpeedPayload {
  code: string;
  /** New playback speed multiplier. */
  speed: number;
}

export interface HostChangeVideoPayload {
  code: string;
  /** New video URL. Resets position to 0 and pauses. */
  videoUrl: string;
}

export interface ParticipantReadyPayload {
  code: string;
}

/** A sync command broadcast to participants after a host action. */
export interface SyncPayload {
  /** The action that triggered this sync. */
  action: "play" | "pause" | "seek" | "speed" | "video";
  /** The resulting playback state. */
  playback: PlaybackSyncState;
  /** The video URL (included on "video" action, otherwise optional). */
  videoUrl?: string;
}

export interface ParticipantDisconnectedPayload {
  socketId: string;
  username: string;
  /** Whether a new host was assigned after this disconnect. */
  newHostSocketId?: string;
}

/** Generic acknowledgement result for events that use `ack`. */
export interface AckResult {
  ok: boolean;
  /** Error code when ok === false. */
  error?: WatchPartyErrorCode;
  /** Human-readable message when ok === false. */
  message?: string;
}

/** Machine-readable error codes for the watch-party engine. */
export type WatchPartyErrorCode =
  | "ROOM_NOT_FOUND"
  | "DUPLICATE_ROOM"
  | "DUPLICATE_USERNAME"
  | "NOT_HOST"
  | "NOT_IN_ROOM"
  | "ALREADY_IN_ROOM"
  | "INVALID_PAYLOAD"
  | "INTERNAL_ERROR";

/** A structured watch-party error sent to clients. */
export interface WatchPartyError {
  code: WatchPartyErrorCode;
  message: string;
}
