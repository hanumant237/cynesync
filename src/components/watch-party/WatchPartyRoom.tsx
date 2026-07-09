"use client";

/**
 * CineSync — WatchPartyRoom
 *
 * The in-room view: room header, connection status, playback status, host
 * controls (host only), participant list, invite card, and the realtime
 * chat panel. Responsive grid layout that stacks on mobile.
 *
 * The chat panel reuses the existing Socket.IO connection from useWatchParty
 * via the useChat hook — no second socket is created.
 */

import { motion } from "framer-motion";
import { Container } from "@/components/common/Container";
import {
  ConnectionStatus,
  HostControls,
  InviteCard,
  ParticipantList,
  PlaybackStatus,
  RoomHeader,
} from "@/components/watch-party";
import { ChatPanel } from "@/components/chat";
import { useChat } from "@/hooks/useChat";
import type { UseWatchPartyReturn } from "@/hooks/useWatchParty";

export interface WatchPartyRoomProps {
  wp: UseWatchPartyReturn;
}

export function WatchPartyRoom({ wp }: WatchPartyRoomProps) {
  const { room, isHost, connectionStatus, currentPosition, mySocketId } = wp;

  // Reuse the existing socket for chat — no second connection.
  const chat = useChat(
    wp.socket,
    room?.code ?? null,
    mySocketId,
    wp.myUsername,
    connectionStatus === "connected",
  );

  if (!room) return null;

  return (
    <Container className="flex flex-1 flex-col gap-6 py-8">
      <RoomHeader
        roomCode={room.code}
        isHost={isHost}
        connectionStatus={connectionStatus}
        onLeave={wp.leaveRoom}
      />

      {/* Three-column grid on large screens: main | sidebar | chat */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px_340px]">
        {/* Main column */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col gap-6"
        >
          {/* Connection + sync status strip */}
          <div className="flex flex-wrap items-center gap-3">
            <ConnectionStatus status={connectionStatus} />
            <SyncStatusIndicator status={wp.syncStatus} />
          </div>

          {/* Playback status */}
          <PlaybackStatus
            playback={room.playback}
            currentPosition={currentPosition}
            videoUrl={room.videoUrl}
          />

          {/* Host controls (host only) */}
          {isHost ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              <HostControls
                playback={room.playback}
                currentPosition={currentPosition}
                onPlay={wp.hostPlay}
                onPause={wp.hostPause}
                onSeek={wp.hostSeek}
                onSpeedChange={wp.hostChangeSpeed}
                onVideoChange={wp.hostChangeVideo}
              />
            </motion.div>
          ) : null}
        </motion.div>

        {/* Sidebar: participants + invite */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          className="flex flex-col gap-6"
        >
          <ParticipantList participants={room.participants} mySocketId={mySocketId} />
          <InviteCard roomCode={room.code} />
        </motion.div>

        {/* Chat panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" }}
          className="flex flex-col"
        >
          <ChatPanel
            chat={chat}
            mySocketId={mySocketId}
            connectionStatus={connectionStatus}
          />
        </motion.div>
      </div>
    </Container>
  );
}

/** Small animated sync-status pill. */
function SyncStatusIndicator({
  status,
}: {
  status: UseWatchPartyReturn["syncStatus"];
}) {
  const config: Record<
    typeof status,
    { label: string; className: string; pulse: boolean }
  > = {
    synced: {
      label: "Synced",
      className: "border-emerald-400/20 bg-emerald-500/5 text-emerald-300",
      pulse: false,
    },
    synchronizing: {
      label: "Synchronizing",
      className: "border-brand-purple/30 bg-brand-purple/10 text-brand-purple-soft",
      pulse: true,
    },
    buffering: {
      label: "Buffering",
      className: "border-amber-400/20 bg-amber-500/5 text-amber-300",
      pulse: true,
    },
    disconnected: {
      label: "Not synced",
      className: "border-red-400/20 bg-red-500/5 text-red-300",
      pulse: false,
    },
  };
  const cfg = config[status];
  return (
    <span
      className={
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium " +
        cfg.className
      }
    >
      <span className="relative flex h-1.5 w-1.5">
        {cfg.pulse ? (
          <motion.span
            className="inline-flex h-full w-full rounded-full bg-current"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ) : (
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </span>
      {cfg.label}
    </span>
  );
}
