"use client";

/**
 * CineSync — Player page
 *
 * Hosts the premium media player. A URL input bar sits above the player so a
 * user can paste any HLS (.m3u8) or native video URL; on Play the VideoPlayer
 * loads it. A sample HLS stream is preloaded so the player is immediately
 * functional for development & testing.
 *
 * No backend, FFmpeg, watch-party, chat, or Socket.IO logic in this phase.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Keyboard } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/Container";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { UrlInputBar, VideoPlayer } from "@/components/player";
import { DEFAULT_SAMPLE_STREAM } from "@/utils/player";

/** Keyboard shortcut reference shown beneath the player. */
const SHORTCUTS: ReadonlyArray<{ keys: string; label: string }> = [
  { keys: "Space", label: "Play / Pause" },
  { keys: "←", label: "Back 10s" },
  { keys: "→", label: "Forward 10s" },
  { keys: "F", label: "Fullscreen" },
  { keys: "M", label: "Mute" },
];

export function PlayerPage() {
  const { navigate } = useNavigation();
  const [src, setSrc] = useState<string | null>(DEFAULT_SAMPLE_STREAM);

  return (
    <Container className="flex flex-1 flex-col gap-8 py-8">
      <PageHeader
        eyebrow="Universal playback"
        title="Media"
        titleGradient="Player"
        description="Paste any HLS stream or video URL you own or are authorized to access. A sample stream is loaded for you."
        actions={
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("library")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        }
      />

      {/* URL input */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <GlassCard className="p-3 sm:p-4">
          <UrlInputBar
            defaultValue={DEFAULT_SAMPLE_STREAM}
            onPlay={(url) => setSrc(url)}
          />
        </GlassCard>
      </motion.div>

      {/* Player */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
        className="mx-auto w-full max-w-4xl"
      >
        <VideoPlayer src={src} />
      </motion.div>

      {/* Keyboard shortcuts reference */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        className="mx-auto w-full max-w-4xl"
      >
        <GlassCard className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Keyboard className="h-4 w-4 text-brand-purple-soft" />
            Keyboard shortcuts
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-5">
            {SHORTCUTS.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-white/15 bg-white/5 px-1.5 text-[11px] font-semibold text-foreground/90">
                  {s.keys}
                </kbd>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </Container>
  );
}
