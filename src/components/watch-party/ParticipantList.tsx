"use client";

/**
 * CineSync — ParticipantList
 *
 * Animated list of ParticipantCard entries. Uses AnimatePresence so join/leave
 * transitions are smooth. Shows a count header and a "waiting" state when the
 * room has only one participant.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Users } from "lucide-react";
import { GlassCard } from "@/components/common/GlassCard";
import { ParticipantCard } from "./ParticipantCard";
import type { Participant } from "@/types/watchParty";

export function ParticipantList({
  participants,
  mySocketId,
}: {
  participants: Participant[];
  mySocketId: string | null;
}) {
  const count = participants.length;

  return (
    <GlassCard className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Users className="h-4 w-4 text-brand-purple-soft" />
          Participants
        </h3>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70">
          {count}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {participants.map((p) => (
            <ParticipantCard
              key={p.socketId}
              participant={p}
              isMe={p.socketId === mySocketId}
            />
          ))}
        </AnimatePresence>

        {count <= 1 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-muted-foreground"
          >
            Waiting for others to join…
          </motion.div>
        ) : null}
      </div>
    </GlassCard>
  );
}
