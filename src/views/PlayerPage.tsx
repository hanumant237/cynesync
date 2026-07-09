"use client";

/**
 * CineSync — Player page
 *
 * Connects the existing VideoPlayer to the streaming backend. The user pastes
 * a media URL; the page calls POST /stream (via the stream service) which
 * inspects the media and returns either a direct playback URL or a transcoded
 * HLS playlist URL. The resolved URL is handed to the VideoPlayer, which loads
 * it via hls.js (with gateway-aware routing) or native playback.
 *
 * Preparation lifecycle (useStreamPreparation):
 *   idle → preparing → detecting → (transcoding) → ready → player takes over
 *   any state → error (friendly error card with retry)
 *
 * No watch-party, chat, voice, or Socket.IO logic in this phase.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Keyboard } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { useStreamPreparation } from "@/hooks/useStreamPreparation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/Container";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import {
  UrlInputBar,
  VideoPlayer,
  StreamPreparing,
  StreamErrorCard,
} from "@/components/player";
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
  const {
    state: prepareState,
    message: prepareMessage,
    playbackUrl,
    session,
    error,
    prepare,
    reset,
  } = useStreamPreparation();

  // The URL currently in the input — used to retry the same URL on error.
  const [lastUrl, setLastUrl] = useState(DEFAULT_SAMPLE_STREAM);

  const isPreparing =
    prepareState === "preparing" ||
    prepareState === "detecting" ||
    prepareState === "transcoding";
  const isError = prepareState === "error";
  const isReady = prepareState === "ready" && playbackUrl !== null;

  return (
    <Container className="flex flex-1 flex-col gap-8 py-8">
      <PageHeader
        eyebrow="Universal playback"
        title="Media"
        titleGradient="Player"
        description="Paste any video URL you own or are authorized to access. CineSync inspects it and streams it directly or transcodes to HLS on the fly."
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
            onPlay={(url) => {
              setLastUrl(url);
              prepare(url);
            }}
          />
        </GlassCard>
      </motion.div>

      {/* Player stage: preparing overlay | error card | video player */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
        className="mx-auto w-full max-w-4xl"
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {/* The VideoPlayer is always mounted so the <video> element persists.
              It receives the playback URL only when preparation is ready. */}
          <VideoPlayer src={isReady ? playbackUrl : null} />

          {/* Preparing overlay (covers the player's idle state while the
              backend is inspecting / transcoding). */}
          <StreamPreparing
            visible={isPreparing}
            state={prepareState}
            message={prepareMessage}
          />

          {/* Error card (backend / network / timeout errors). */}
          <StreamErrorCard
            visible={isError}
            error={error}
            onRetry={() => prepare(lastUrl)}
            onDismiss={reset}
          />
        </div>

        {/* Session metadata strip (shown when a session is available). */}
        <AnimatePresence>
          {session ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" />
                {session.media.container}
              </span>
              {session.media.resolution ? (
                <span>{session.media.resolution}</span>
              ) : null}
              {session.media.video?.codecName ? (
                <span>{session.media.video.codecName}</span>
              ) : null}
              {session.media.audio?.codecName ? (
                <span>{session.media.audio.codecName} audio</span>
              ) : null}
              <span className="text-brand-purple-soft">
                {session.strategy === "direct" ? "Direct playback" : "Transcoded HLS"}
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
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
