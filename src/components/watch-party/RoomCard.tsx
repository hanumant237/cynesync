"use client";

/**
 * CineSync — RoomCard
 *
 * The lobby card shown when the user is not yet in a room. Contains:
 *  - A "Create Room" section (username + optional video URL → create)
 *  - A "Join Room" section (room code + username → join)
 *
 * Uses the premium glass aesthetic consistent with the rest of the app.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clapperboard, LogIn, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/common/GlassCard";
import { DEFAULT_SAMPLE_STREAM } from "@/utils/player";

export interface RoomCardProps {
  onCreateRoom: (username: string, videoUrl: string) => void;
  onJoinRoom: (code: string, username: string) => void;
  /** Optional pre-filled room code (e.g. from an invite link). */
  initialRoomCode?: string;
  /** Whether a connection/loading is in progress. */
  loading?: boolean;
}

type Tab = "create" | "join";

export function RoomCard({
  onCreateRoom,
  onJoinRoom,
  initialRoomCode = "",
  loading = false,
}: RoomCardProps) {
  const [tab, setTab] = useState<Tab>(initialRoomCode ? "join" : "create");
  const [createUsername, setCreateUsername] = useState("");
  const [createVideoUrl, setCreateVideoUrl] = useState(DEFAULT_SAMPLE_STREAM);
  const [joinCode, setJoinCode] = useState(initialRoomCode);
  const [joinUsername, setJoinUsername] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUsername.trim()) return;
    onCreateRoom(createUsername.trim(), createVideoUrl.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !joinUsername.trim()) return;
    onJoinRoom(joinCode.trim(), joinUsername.trim());
  };

  return (
    <GlassCard className="mx-auto w-full max-w-md overflow-hidden p-0">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <TabButton
          active={tab === "create"}
          onClick={() => setTab("create")}
          icon={<Clapperboard className="h-4 w-4" />}
          label="Create Room"
        />
        <TabButton
          active={tab === "join"}
          onClick={() => setTab("join")}
          icon={<LogIn className="h-4 w-4" />}
          label="Join Room"
        />
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, x: tab === "create" ? -12 : 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="p-6"
      >
        {tab === "create" ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your name
              </label>
              <Input
                value={createUsername}
                onChange={(e) => setCreateUsername(e.target.value)}
                placeholder="e.g. Alex"
                aria-label="Your name"
                className="h-11 rounded-xl border-white/10 bg-white/5 text-sm focus-visible:border-brand-purple/50 focus-visible:ring-brand-purple/30"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Video URL
              </label>
              <Input
                value={createVideoUrl}
                onChange={(e) => setCreateVideoUrl(e.target.value)}
                placeholder="https://…"
                aria-label="Video URL"
                className="h-11 rounded-xl border-white/10 bg-white/5 text-sm focus-visible:border-brand-purple/50 focus-visible:ring-brand-purple/30"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !createUsername.trim()}
              className="h-11 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-sm font-medium text-white shadow-[0_6px_20px_rgba(139,92,246,0.35)] transition-transform duration-200 hover:scale-[1.02] disabled:opacity-50"
            >
              <Users className="h-4 w-4" />
              Create Room
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Room code
              </label>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD12"
                aria-label="Room code"
                maxLength={8}
                className="h-11 rounded-xl border-white/10 bg-white/5 text-center font-mono text-lg tracking-[0.3em] focus-visible:border-brand-purple/50 focus-visible:ring-brand-purple/30"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your name
              </label>
              <Input
                value={joinUsername}
                onChange={(e) => setJoinUsername(e.target.value)}
                placeholder="e.g. Sam"
                aria-label="Your name"
                className="h-11 rounded-xl border-white/10 bg-white/5 text-sm focus-visible:border-brand-purple/50 focus-visible:ring-brand-purple/30"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !joinCode.trim() || !joinUsername.trim()}
              className="h-11 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-sm font-medium text-white shadow-[0_6px_20px_rgba(139,92,246,0.35)] transition-transform duration-200 hover:scale-[1.02] disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              Join Room
            </Button>
          </form>
        )}
      </motion.div>
    </GlassCard>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "relative flex flex-1 items-center justify-center gap-2 py-4 text-sm font-medium transition-colors " +
        (active ? "text-foreground" : "text-muted-foreground hover:text-foreground")
      }
    >
      {icon}
      {label}
      {active ? (
        <motion.span
          layoutId="room-card-tab"
          className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-brand-purple to-brand-blue"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      ) : null}
    </button>
  );
}
