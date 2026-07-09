"use client";

/**
 * CineSync — useChat
 *
 * Realtime chat hook for the Watch Party. REUSES the existing Socket.IO
 * connection from useWatchParty (does NOT create a second socket). Attaches
 * chat-specific listeners (receive-message, typing, stop-typing) and exposes
 * send/typing actions + message/typing/unread state.
 *
 * The hook is driven by the `room` and `socket` from useWatchParty — when
 * either changes (e.g. joining/leaving a room), the chat state resets.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type {
  ChatMessage,
  ReceiveMessagePayload,
  TypingPayload,
} from "@/types/watchParty";

/** All tunables for the chat hook. */
const CHAT_CONSTANTS = {
  /** Max message length (matched on the backend). */
  MAX_MESSAGE_LENGTH: 500,
  /** How long (ms) a typing indicator stays active before auto-clearing. */
  TYPING_TIMEOUT_MS: 4000,
} as const;

export interface UseChatReturn {
  /** All chat messages (user + system), oldest first. */
  messages: ChatMessage[];
  /** Usernames currently typing (excluding self). */
  typingUsers: string[];
  /** Number of messages received while the chat was collapsed/hidden. */
  unreadCount: number;
  /** Whether a send is in-flight (briefly true after pressing send). */
  isSending: boolean;
  /** Whether the socket is connected (send disabled when false). */
  isConnected: boolean;
  /** Send a chat message. Returns true on success. */
  sendMessage: (text: string) => Promise<boolean>;
  /** Notify the room that the user is typing. */
  notifyTyping: () => void;
  /** Notify the room that the user stopped typing (e.g. on send). */
  notifyStopTyping: () => void;
  /** Mark all messages as read (resets unreadCount to 0). */
  markAsRead: () => void;
  /** Clear all messages (used when leaving a room). */
  clearMessages: () => void;
}

export function useChat(
  socket: Socket | null,
  roomCode: string | null,
  mySocketId: string | null,
  myUsername: string | null,
  isConnected: boolean,
): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);

  // Track typing-clear timers so we can reset them on each keystroke.
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Track the last time we emitted a typing event (throttle).
  const lastTypingEmitRef = useRef<number>(0);
  // Whether we're currently in "typing" state (to avoid duplicate stop-typing).
  const isTypingRef = useRef(false);
  // Track the previous room code so we can reset state when it changes.
  const prevRoomCodeRef = useRef<string | null>(null);

  // -------------------------------------------------------------------------
  // Socket event listeners (also resets state when room changes)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!socket || !roomCode) return;

    // Reset chat state when the room changes (not on every re-render).
    // This is a legitimate "sync external state → React state" pattern: the
    // room code is external to the hook and we need to reset when it changes.
    if (prevRoomCodeRef.current !== roomCode) {
      prevRoomCodeRef.current = roomCode;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      setTypingUsers([]);
      setUnreadCount(0);
      typingTimersRef.current.clear();
      isTypingRef.current = false;
    }

    const onReceiveMessage = (payload: ReceiveMessagePayload) => {
      setMessages((prev) => [...prev, payload.message]);
      // Don't count own messages as unread.
      if (payload.message.socketId !== mySocketId) {
        setUnreadCount((c) => c + 1);
      }
    };

    const onTyping = (payload: TypingPayload) => {
      if (payload.username === myUsername) return;
      setTypingUsers((prev) =>
        prev.includes(payload.username) ? prev : [...prev, payload.username],
      );
      // Auto-clear after a timeout (in case stop-typing is missed).
      const existing = typingTimersRef.current.get(payload.username);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== payload.username));
        typingTimersRef.current.delete(payload.username);
      }, CHAT_CONSTANTS.TYPING_TIMEOUT_MS);
      typingTimersRef.current.set(payload.username, timer);
    };

    const onStopTyping = (payload: TypingPayload) => {
      if (payload.username === myUsername) return;
      setTypingUsers((prev) => prev.filter((u) => u !== payload.username));
      const existing = typingTimersRef.current.get(payload.username);
      if (existing) {
        clearTimeout(existing);
        typingTimersRef.current.delete(payload.username);
      }
    };

    socket.on("watch-party:receive-message", onReceiveMessage);
    socket.on("watch-party:typing", onTyping);
    socket.on("watch-party:stop-typing", onStopTyping);

    return () => {
      socket.off("watch-party:receive-message", onReceiveMessage);
      socket.off("watch-party:typing", onTyping);
      socket.off("watch-party:stop-typing", onStopTyping);
    };
  }, [socket, roomCode, mySocketId, myUsername]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      if (!socket || !roomCode || !isConnected) return false;
      const trimmed = text.trim();
      if (!trimmed || trimmed.length > CHAT_CONSTANTS.MAX_MESSAGE_LENGTH) return false;

      setIsSending(true);
      // Stop typing when sending.
      if (isTypingRef.current) {
        socket.emit("watch-party:stop-typing", { code: roomCode, username: myUsername ?? "" });
        isTypingRef.current = false;
      }

      return new Promise<boolean>((resolve) => {
        socket.emit(
          "watch-party:send-message",
          { code: roomCode, text: trimmed },
          (res: { ok: boolean }) => {
            setIsSending(false);
            resolve(res.ok);
          },
        );
      });
    },
    [socket, roomCode, isConnected, myUsername],
  );

  const notifyTyping = useCallback(() => {
    if (!socket || !roomCode || !isConnected || !myUsername) return;
    // Throttle: emit at most once per second.
    const now = Date.now();
    if (now - lastTypingEmitRef.current < 1000) return;
    lastTypingEmitRef.current = now;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
    }
    socket.emit("watch-party:typing", { code: roomCode, username: myUsername });
  }, [socket, roomCode, isConnected, myUsername]);

  const notifyStopTyping = useCallback(() => {
    if (!socket || !roomCode || !isConnected || !myUsername) return;
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("watch-party:stop-typing", { code: roomCode, username: myUsername });
    }
  }, [socket, roomCode, isConnected, myUsername]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setTypingUsers([]);
    setUnreadCount(0);
  }, []);

  return {
    messages,
    typingUsers,
    unreadCount,
    isSending,
    isConnected,
    sendMessage,
    notifyTyping,
    notifyStopTyping,
    markAsRead,
    clearMessages,
  };
}

export { CHAT_CONSTANTS };
