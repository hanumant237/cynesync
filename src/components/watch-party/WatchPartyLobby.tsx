"use client";

/**
 * CineSync — WatchPartyLobby
 *
 * The lobby view: a hero header + the RoomCard (create/join). Shown when the
 * user is not yet in a room.
 */

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Container } from "@/components/common/Container";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { RoomCard } from "@/components/watch-party/RoomCard";

export interface WatchPartyLobbyProps {
  onCreateRoom: (username: string, videoUrl: string) => void;
  onJoinRoom: (code: string, username: string) => void;
  loading?: boolean;
}

export function WatchPartyLobby({
  onCreateRoom,
  onJoinRoom,
  loading,
}: WatchPartyLobbyProps) {
  return (
    <Container className="flex flex-1 flex-col gap-8 py-10">
      <PageHeader
        eyebrow="In sync"
        title="Watch"
        titleGradient="Party"
        description="Watch together in real time. Create a room, share the code, and stay perfectly in sync."
      />

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { icon: Users, label: "Real-time sync" },
          { icon: Users, label: "Host controls" },
          { icon: Users, label: "Auto reconnection" },
        ].map((f) => (
          <GlassCard key={f.label} className="flex items-center gap-2 px-4 py-2">
            <f.icon className="h-3.5 w-3.5 text-brand-purple-soft" />
            <span className="text-xs font-medium text-foreground/80">{f.label}</span>
          </GlassCard>
        ))}
      </motion.div>

      {/* Room card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
        className="flex justify-center py-4"
      >
        <RoomCard onCreateRoom={onCreateRoom} onJoinRoom={onJoinRoom} loading={loading} />
      </motion.div>
    </Container>
  );
}
