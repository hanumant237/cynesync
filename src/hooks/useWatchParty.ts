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
  const socketRef = useRef<Socket | null>(null);
  const roomRef = useRef<RoomSnapshot | null>(null);

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
  // Socket lifecycle
  // -------------------------------------------------------------------------

  /** Ensure a socket exists and is connected. Returns the socket. */
  const ensureSocket = useCallback((): Socket => {
    if (socketRef.current) return socketRef.current;

    const url = `${SOCKET_BASE_URL}/?XTransformPort=${BACKEND_PORT}`;
    const socket = io(url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: WP_CONSTANTS.RECONNECT_DELAYS_MS[0],
      reconnectionDelayMax: WP_CONSTANTS.RECONNECT_DELAYS_MS[2],
      autoConnect: false,
    });
    socketRef.current = socket;

    // Connection status listeners.
    socket.on("connect", () => {
      setMySocketId(socket.id ?? null);
      setConnectionStatus("connected");
      setSyncStatus("synced");
    });
    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
      setSyncStatus("disconnected");
    });
    socket.io.on("reconnect_attempt", () => {
      setConnectionStatus("reconnecting");
      setSyncStatus("disconnected");
    });
    socket.io.on("reconnect", () => {
      setConnectionStatus("connected");
      // Re-join the room if we were in one.
      if (roomRef.current) {
        socket.emit("watch-party:participant-ready", { code: roomRef.current.code });
      }
    });
    socket.on("connect_error", () => {
      setConnectionStatus("disconnected");
    });

    // Watch-party event listeners.
    socket.on("watch-party:room-state", (snapshot: RoomSnapshot) => {
      setRoom(snapshot);
      setSyncStatus("synced");
    });
    socket.on("watch-party:sync", (payload: SyncPayload) => {
      setSyncStatus("synchronizing");
      // Apply the sync immediately — the position ticker will advance it.
      if (roomRef.current) {
        setRoom({
          ...roomRef.current,
          playback: payload.playback,
          videoUrl: payload.videoUrl ?? roomRef.current.videoUrl,
        });
      }
      // Clear the "synchronizing" indicator after a brief moment.
      setTimeout(() => setSyncStatus("synced"), 600);
    });
    socket.on("watch-party:participant-joined", (_participant: Participant) => {
      // The room-state broadcast will include the new participant, so we
      // don't need to mutate here — just acknowledge.
    });
    socket.on("watch-party:participant-disconnected", () => {
      // The room-state broadcast will reflect the updated participant list.
      // If a host migration occurred, room-state will carry the new hostSocketId.
    });
    socket.on("watch-party:error", (err: { code: WatchPartyErrorCode; message: string }) => {
      setError(classifyError(err.code, err.message));
      setPhase("error");
    });

    return socket;
  }, []);

  /** Connect the socket (used when entering the watch-party page). */
  useEffect(() => {
    const socket = ensureSocket();
    if (!socket.connected) {
      // The socket's own event listeners (connect/reconnect_attempt) drive
      // connectionStatus, so we don't set state here — that would trigger a
      // cascading render. Just initiate the connection.
      socket.connect();
    }
    return () => {
      // Disconnect on unmount.
      socket.disconnect();
      socketRef.current = null;
    };
  }, [ensureSocket]);

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
    const socket = socketRef.current;
    if (socket && roomRef.current) {
      socket.emit("watch-party:leave-room");
    }
    setRoom(null);
    setPhase("lobby");
    setCurrentPosition(0);
  }, []);

  // -------------------------------------------------------------------------
  // Host controls
  // -------------------------------------------------------------------------

  const emitHostControl = useCallback(
    (
      event: "watch-party:host-play" | "watch-party:host-pause",
      position: number,
    ): Promise<void> => {
      const socket = socketRef.current;
      const room = roomRef.current;
      if (!socket || !room) return Promise.resolve();
      return new Promise<void>((resolve) => {
        socket.emit(event, { code: room.code, position }, () => resolve());
      });
    },
    [],
  );

  const hostPlay = useCallback(async () => {
    await emitHostControl("watch-party:host-play", currentPosition);
  }, [emitHostControl, currentPosition]);

  const hostPause = useCallback(async () => {
    await emitHostControl("watch-party:host-pause", currentPosition);
  }, [emitHostControl, currentPosition]);

  const hostSeek = useCallback(
    async (position: number) => {
      const socket = socketRef.current;
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
    [],
  );

  const hostChangeSpeed = useCallback(
    async (speed: number) => {
      const socket = socketRef.current;
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
    [],
  );

  const hostChangeVideo = useCallback(
    async (videoUrl: string) => {
      const socket = socketRef.current;
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
    [],
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

  return {
    phase,
    connectionStatus,
    syncStatus,
    room,
    mySocketId,
    isHost,
    currentPosition,
    error,
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
