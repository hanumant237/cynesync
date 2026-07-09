"use client";

/**
 * CineSync — useWatchParty
 *
 * The realtime watch-party hook. Owns the Socket.IO client connection and
 * exposes a fully-typed state machine the UI renders:
 *
 *   lobby → connecting → in-room → (error | lobby)
 *
 * Responsibilities:
 *  - connect/disconnect the socket (through the gateway)
 *  - create-room / join-room / leave-room (with ack callbacks)
 *  - listen for room-state, sync, participant-joined/disconnected, error
 *  - expose host controls (play/pause/seek/change-speed/change-video)
 *  - track connection status + sync status with latency-compensated position
 *  - classify backend errors into friendly UI errors
 *
 * No markup — pure state + actions, consumed by the WatchPartyPage.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { BACKEND_PORT, SOCKET_BASE_URL } from "@/utils/constants";
import type {
  AckResult,
  ConnectionStatusKind,
  CreateRoomResult,
  JoinRoomResult,
  Participant,
  PlaybackSyncState,
  RoomSnapshot,
  SyncPayload,
  SyncStatus,
  WatchPartyErrorCode,
  WatchPartyPhase,
  WatchPartyUiError,
} from "@/types/watchParty";

/** All tunables for the watch-party hook. */
const WP_CONSTANTS = {
  /** Interval (ms) for the local position ticker that advances playback. */
  POSITION_TICK_MS: 500,
  /** Reconnect delay cap (ms) — Socket.IO handles backoff internally. */
  RECONNECT_DELAYS_MS: [1000, 2000, 5000] as const,
} as const;

export interface UseWatchPartyReturn {
  /** Current UI phase. */
  phase: WatchPartyPhase;
  /** Connection status (for the animated indicator). */
  connectionStatus: ConnectionStatusKind;
  /** Sync status of local playback. */
  syncStatus: SyncStatus;
  /** The current room snapshot, or null when not in a room. */
  room: RoomSnapshot | null;
  /** The local user's socket id (set once connected). */
  mySocketId: string | null;
  /** Whether the local user is the host. */
  isHost: boolean;
  /** Latency-compensated current playback position (seconds). */
  currentPosition: number;
  /** Classified UI error (set when phase === "error"). */
  error: WatchPartyUiError | null;
  /** The underlying Socket.IO socket (exposed so useChat can reuse it). */
  socket: Socket | null;
  /** The local user's display name (from the room's participant list). */
  myUsername: string | null;
  /** Create a new room (creator becomes host). */
  createRoom: (username: string, videoUrl: string) => Promise<void>;
  /** Join an existing room by code. */
  joinRoom: (code: string, username: string) => Promise<void>;
  /** Leave the current room and return to the lobby. */
  leaveRoom: () => void;
  /** Host: start playback. */
  hostPlay: () => Promise<void>;
  /** Host: pause playback. */
  hostPause: () => Promise<void>;
  /** Host: seek to a position (seconds). */
  hostSeek: (position: number) => Promise<void>;
  /** Host: change playback speed. */
  hostChangeSpeed: (speed: number) => Promise<void>;
  /** Host: change the current video URL. */
  hostChangeVideo: (videoUrl: string) => Promise<void>;
  /** Dismiss the current error and return to the lobby. */
  dismissError: () => void;
}

export function useWatchParty(): UseWatchPartyReturn {
  const roomRef = useRef<RoomSnapshot | null>(null);

  // Create the socket exactly once via a lazy state initializer. This avoids
  // creating it in an effect (which would require setState-in-effect) and
  // avoids re-creating it on every render.
  const [socket] = useState<Socket>(() => {
    const url = `${SOCKET_BASE_URL}/?XTransformPort=${BACKEND_PORT}`;
    return io(url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: WP_CONSTANTS.RECONNECT_DELAYS_MS[0],
      reconnectionDelayMax: WP_CONSTANTS.RECONNECT_DELAYS_MS[2],
      autoConnect: false,
    });
  });

  const [phase, setPhase] = useState<WatchPartyPhase>("lobby");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusKind>("connecting");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("disconnected");
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [mySocketId, setMySocketId] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [error, setError] = useState<WatchPartyUiError | null>(null);

  // Keep roomRef in sync with state for use inside socket callbacks.
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // -------------------------------------------------------------------------
  // Latency-compensated position ticker
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!room || connectionStatus !== "connected") return;
    const tick = setInterval(() => {
      if (room.playback.state !== "playing") {
        setCurrentPosition(room.playback.position);
        return;
      }
      const now = Date.now();
      const elapsed = (now - room.playback.lastUpdatedAt) / 1000;
      setCurrentPosition(room.playback.position + elapsed * room.playback.speed);
    }, WP_CONSTANTS.POSITION_TICK_MS);
    return () => clearInterval(tick);
  }, [room, connectionStatus]);

  // -------------------------------------------------------------------------
  // Socket lifecycle: wire event listeners + connect on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    // Connection status listeners.
    const onConnect = () => {
      setMySocketId(socket.id ?? null);
      setConnectionStatus("connected");
      setSyncStatus("synced");
    };
    const onDisconnect = () => {
      setConnectionStatus("disconnected");
      setSyncStatus("disconnected");
    };
    const onReconnectAttempt = () => {
      setConnectionStatus("reconnecting");
      setSyncStatus("disconnected");
    };
    const onReconnect = () => {
      setConnectionStatus("connected");
      if (roomRef.current) {
        socket.emit("watch-party:participant-ready", { code: roomRef.current.code });
      }
    };
    const onConnectError = () => {
      setConnectionStatus("disconnected");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect", onReconnect);
    socket.on("connect_error", onConnectError);

    // Watch-party event listeners.
    const onRoomState = (snapshot: RoomSnapshot) => {
      setRoom(snapshot);
      setSyncStatus("synced");
    };
    const onSync = (payload: SyncPayload) => {
      setSyncStatus("synchronizing");
      if (roomRef.current) {
        setRoom({
          ...roomRef.current,
          playback: payload.playback,
          videoUrl: payload.videoUrl ?? roomRef.current.videoUrl,
        });
      }
      setTimeout(() => setSyncStatus("synced"), 600);
    };
    const onParticipantJoined = (_participant: Participant) => {
      // room-state broadcast includes the new participant.
    };
    const onParticipantDisconnected = () => {
      // room-state broadcast reflects the updated participant list.
    };
    const onError = (err: { code: WatchPartyErrorCode; message: string }) => {
      setError(classifyError(err.code, err.message));
      setPhase("error");
    };

    socket.on("watch-party:room-state", onRoomState);
    socket.on("watch-party:sync", onSync);
    socket.on("watch-party:participant-joined", onParticipantJoined);
    socket.on("watch-party:participant-disconnected", onParticipantDisconnected);
    socket.on("watch-party:error", onError);

    // Connect now.
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect", onReconnect);
      socket.off("connect_error", onConnectError);
      socket.off("watch-party:room-state", onRoomState);
      socket.off("watch-party:sync", onSync);
      socket.off("watch-party:participant-joined", onParticipantJoined);
      socket.off("watch-party:participant-disconnected", onParticipantDisconnected);
      socket.off("watch-party:error", onError);
      socket.disconnect();
    };
  }, [socket]);

  /** Ensure the socket exists (it always does now — created in useState). */
  const ensureSocket = useCallback((): Socket => socket, [socket]);

  // -------------------------------------------------------------------------
  // Room operations
  // -------------------------------------------------------------------------

  const createRoom = useCallback(
    async (username: string, videoUrl: string) => {
      const socket = ensureSocket();
      if (!socket.connected) {
        socket.connect();
        setConnectionStatus("connecting");
      }
      setPhase("connecting");
      return new Promise<void>((resolve, reject) => {
        socket.emit(
          "watch-party:create-room",
          { username, videoUrl },
          (res: CreateRoomResult) => {
            if (res.ok && res.room) {
              setRoom(res.room);
              setMySocketId(socket.id ?? null);
              setPhase("in-room");
              resolve();
            } else {
              setError(classifyError(res.error, res.message));
              setPhase("error");
              reject(new Error(res.message ?? "Failed to create room"));
            }
          },
        );
      });
    },
    [ensureSocket],
  );

  const joinRoom = useCallback(
    async (code: string, username: string) => {
      const socket = ensureSocket();
      if (!socket.connected) {
        socket.connect();
        setConnectionStatus("connecting");
      }
      setPhase("connecting");
      return new Promise<void>((resolve, reject) => {
        socket.emit(
          "watch-party:join-room",
          { code: code.toUpperCase(), username },
          (res: JoinRoomResult) => {
            if (res.ok && res.room) {
              setRoom(res.room);
              setMySocketId(socket.id ?? null);
              setPhase("in-room");
              resolve();
            } else {
              setError(classifyError(res.error, res.message));
              setPhase("error");
              reject(new Error(res.message ?? "Failed to join room"));
            }
          },
        );
      });
    },
    [ensureSocket],
  );

  const leaveRoom = useCallback(() => {
    const socket = ensureSocket();
    if (socket && roomRef.current) {
      socket.emit("watch-party:leave-room");
    }
    setRoom(null);
    setPhase("lobby");
    setCurrentPosition(0);
  }, [ensureSocket]);

  // -------------------------------------------------------------------------
  // Host controls
  // -------------------------------------------------------------------------

  const emitHostControl = useCallback(
    (
      event: "watch-party:host-play" | "watch-party:host-pause",
      position: number,
    ): Promise<void> => {
      const socket = ensureSocket();
      const room = roomRef.current;
      if (!socket || !room) return Promise.resolve();
      return new Promise<void>((resolve) => {
        socket.emit(event, { code: room.code, position }, () => resolve());
      });
    },
    [ensureSocket],
  );

  const hostPlay = useCallback(async () => {
    await emitHostControl("watch-party:host-play", currentPosition);
  }, [emitHostControl, currentPosition]);

  const hostPause = useCallback(async () => {
    await emitHostControl("watch-party:host-pause", currentPosition);
  }, [emitHostControl, currentPosition]);

  const hostSeek = useCallback(
    async (position: number) => {
      const socket = ensureSocket();
      const room = roomRef.current;
      if (!socket || !room) return;
      // Optimistically update local position for snappy UX.
      setCurrentPosition(position);
      return new Promise<void>((resolve) => {
        socket.emit(
          "watch-party:host-seek",
          { code: room.code, position },
          (_res: AckResult) => resolve(),
        );
      });
    },
    [ensureSocket],
  );

  const hostChangeSpeed = useCallback(
    async (speed: number) => {
      const socket = ensureSocket();
      const room = roomRef.current;
      if (!socket || !room) return;
      return new Promise<void>((resolve) => {
        socket.emit(
          "watch-party:host-change-speed",
          { code: room.code, speed },
          (_res: AckResult) => resolve(),
        );
      });
    },
    [ensureSocket],
  );

  const hostChangeVideo = useCallback(
    async (videoUrl: string) => {
      const socket = ensureSocket();
      const room = roomRef.current;
      if (!socket || !room) return;
      return new Promise<void>((resolve) => {
        socket.emit(
          "watch-party:host-change-video",
          { code: room.code, videoUrl },
          (_res: AckResult) => resolve(),
        );
      });
    },
    [ensureSocket],
  );

  const dismissError = useCallback(() => {
    setError(null);
    setPhase("lobby");
  }, []);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const isHost = Boolean(
    room && mySocketId && room.hostSocketId === mySocketId,
  );

  const myUsername = (() => {
    if (!room || !mySocketId) return null;
    return room.participants.find((p) => p.socketId === mySocketId)?.username ?? null;
  })();

  return {
    phase,
    connectionStatus,
    syncStatus,
    room,
    mySocketId,
    isHost,
    currentPosition,
    error,
    socket,
    myUsername,
    createRoom,
    joinRoom,
    leaveRoom,
    hostPlay,
    hostPause,
    hostSeek,
    hostChangeSpeed,
    hostChangeVideo,
    dismissError,
  };
}

/**
 * Classify a backend error code into a friendly UI error. Maps each code to
 * a specific error card kind with a title, message, and retryability.
 */
function classifyError(
  code: WatchPartyErrorCode | undefined,
  message: string | undefined,
): WatchPartyUiError {
  switch (code) {
    case "ROOM_NOT_FOUND":
      return {
        kind: "room-not-found",
        title: "Room not found",
        message: message ?? "That room doesn't exist or has been closed.",
        retryable: false,
      };
    case "DUPLICATE_USERNAME":
      return {
        kind: "duplicate-username",
        title: "Username taken",
        message: message ?? "Someone in that room is already using that username.",
        retryable: true,
      };
    case "NOT_HOST":
      return {
        kind: "not-host",
        title: "Host only",
        message: message ?? "Only the host can control playback.",
        retryable: false,
      };
    case "INTERNAL_ERROR":
      return {
        kind: "generic",
        title: "Server error",
        message: message ?? "Something went wrong on the server. Please try again.",
        retryable: true,
      };
    default:
      return {
        kind: "generic",
        title: "Connection failed",
        message: message ?? "Could not connect to the watch-party server.",
        retryable: true,
      };
  }
}
