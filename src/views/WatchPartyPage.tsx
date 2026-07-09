"use client";

/**
 * CineSync — Watch Party page
 *
 * Orchestrates the watch-party experience using the useWatchParty hook and
 * three sub-views:
 *  - lobby  : create/join a room (WatchPartyLobby + RoomCard)
 *  - in-room : connected to a room (WatchPartyRoom)
 *  - error  : a fatal error occurred (WatchPartyErrorCard)
 *
 * All socket communication flows through useWatchParty; this page is purely
 * presentational orchestration with animated transitions between phases.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Container } from "@/components/common/Container";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import {
  WatchPartyErrorCard,
  WatchPartyLobby,
  WatchPartyRoom,
} from "@/components/watch-party";
import { useWatchParty } from "@/hooks/useWatchParty";

export function WatchPartyPage() {
  const wp = useWatchParty();
  const { phase, error } = wp;

  return (
    <AnimatePresence mode="wait">
      {phase === "error" && error ? (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Container className="flex flex-1 flex-col items-center justify-center gap-6 py-20">
            <WatchPartyErrorCard
              error={error}
              onBackToLobby={wp.dismissError}
            />
          </Container>
        </motion.div>
      ) : null}

      {phase === "lobby" || phase === "connecting" ? (
        <motion.div
          key="lobby"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          <WatchPartyLobby
            onCreateRoom={wp.createRoom}
            onJoinRoom={wp.joinRoom}
            loading={phase === "connecting"}
          />
          {phase === "connecting" ? (
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto -mt-2 mb-8 flex max-w-md items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-brand-purple" />
                Connecting to watch-party server…
              </motion.div>
            </Container>
          ) : null}
        </motion.div>
      ) : null}

      {phase === "in-room" ? (
        <motion.div
          key="room"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <WatchPartyRoom wp={wp} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
