"use client";

/**
 * CineSync — RoomHeader
 *
 * Header for the in-room view: room code, host badge, connection status,
 * and a leave button. Sticky at the top of the room view.
 */

import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "./ConnectionStatus";
import { HostBadge } from "./HostBadge";
import type { ConnectionStatusKind } from "@/types/watchParty";

export function RoomHeader({
  roomCode,
  isHost,
  connectionStatus,
  onLeave,
}: {
  roomCode: string;
  isHost: boolean;
  connectionStatus: ConnectionStatusKind;
  onLeave: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.18em] text-brand-purple-soft">
            Watch Party
          </span>
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-2xl font-bold tracking-[0.2em] text-foreground">
              {roomCode}
            </h2>
            {isHost ? <HostBadge /> : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ConnectionStatus status={connectionStatus} />
        <Button
          type="button"
          variant="outline"
          onClick={onLeave}
          className="h-9 rounded-xl border-white/15 bg-white/5 px-4 text-sm text-foreground hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Leave
        </Button>
      </div>
    </motion.div>
  );
}
