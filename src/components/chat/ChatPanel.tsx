"use client";

/**
 * CineSync — ChatPanel
 *
 * The collapsible chat sidebar for the Watch Party room. Renders a header
 * (with collapse toggle + unread badge), a scrollable message list with
 * auto-scroll, a typing indicator, and the chat input.
 *
 * Designed as a right sidebar; collapses to a slim bar on mobile. Glassmorphism
 * dark theme consistent with the rest of the app.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, PanelRightClose, PanelRightOpen, Users } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import type { UseChatReturn } from "@/hooks/useChat";
import type { ConnectionStatusKind } from "@/types/watchParty";
import { cn } from "@/lib/utils";

export interface ChatPanelProps {
  chat: UseChatReturn;
  mySocketId: string | null;
  connectionStatus: ConnectionStatusKind;
  /** Initial collapsed state (defaults to false on desktop, true on mobile). */
  defaultCollapsed?: boolean;
}

export function ChatPanel({
  chat,
  mySocketId,
  connectionStatus,
  defaultCollapsed = false,
}: ChatPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const { messages, typingUsers, unreadCount, isSending, isConnected } = chat;

  // Auto-scroll to bottom when new messages arrive (if the user is near the bottom).
  useEffect(() => {
    if (!autoScroll || collapsed) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, autoScroll, collapsed]);

  // Track whether the user is near the bottom (to enable smart auto-scroll).
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(nearBottom);
  };

  // Mark as read when expanded.
  useEffect(() => {
    if (!collapsed) {
      chat.markAsRead();
    }
  }, [collapsed, chat]);

  const handleToggle = () => {
    setCollapsed((c) => !c);
  };

  // Collapsed view: slim bar with icon + unread badge.
  if (collapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GlassCard className="flex w-full flex-col items-center gap-3 p-3">
          <button
            type="button"
            onClick={handleToggle}
            aria-label="Expand chat"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-purple px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
          <PanelRightOpen className="h-3.5 w-3.5 text-muted-foreground/50" />
        </GlassCard>
      </motion.div>
    );
  }

  // Expanded view: full chat panel.
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <GlassCard className="flex h-full max-h-[600px] flex-col overflow-hidden p-0 lg:max-h-[700px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand-purple-soft" />
            <span className="text-sm font-medium text-foreground">Party chat</span>
            {messages.length > 0 ? (
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/60">
                {messages.length}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <ConnectionDot status={connectionStatus} />
            <button
              type="button"
              onClick={handleToggle}
              aria-label="Collapse chat"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                No messages yet.
                <br />
                Start the conversation!
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isMine={msg.socketId === mySocketId}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Typing indicator + input */}
        <div className="flex flex-col gap-2 border-t border-white/10 p-3">
          <AnimatePresence>
            {typingUsers.length > 0 ? (
              <TypingIndicator usernames={typingUsers} />
            ) : null}
          </AnimatePresence>
          <ChatInput
            isConnected={isConnected}
            isSending={isSending}
            onSend={(text) => {
              void chat.sendMessage(text);
            }}
            onTyping={chat.notifyTyping}
            onStopTyping={chat.notifyStopTyping}
          />
        </div>
      </GlassCard>
    </motion.div>
  );
}

/** Small connection-status dot for the chat header. */
function ConnectionDot({ status }: { status: ConnectionStatusKind }) {
  const config: Record<ConnectionStatusKind, { className: string; label: string }> = {
    connected: { className: "bg-emerald-400", label: "Connected" },
    connecting: { className: "bg-amber-400", label: "Connecting" },
    reconnecting: { className: "bg-amber-400", label: "Reconnecting" },
    disconnected: { className: "bg-red-400", label: "Disconnected" },
  };
  const cfg = config[status];
  return (
    <span
      className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
      title={cfg.label}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.className)} />
    </span>
  );
}
