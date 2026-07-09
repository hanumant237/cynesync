"use client";

/**
 * CineSync — Player page (placeholder)
 *
 * Professional placeholder layout for the universal player: a large 16:9
 * video surface placeholder with a control bar, plus a metadata sidebar.
 * No playback/streaming logic in this phase.
 */

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Maximize,
  Pause,
  Settings2,
  SkipBack,
  SkipForward,
  Subtitles,
  Volume2,
} from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/Container";
import { GlassCard } from "@/components/common/GlassCard";

export function PlayerPage() {
  const { navigate } = useNavigation();

  return (
    <Container className="flex flex-1 flex-col gap-6 py-8">
      {/* Back */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("library")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Player surface */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-col gap-4"
        >
          <GlassCard className="overflow-hidden p-0">
            {/* 16:9 video placeholder */}
            <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-brand-purple/10 via-black/40 to-brand-blue/10">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur transition-colors hover:bg-brand-purple/80">
                <Pause className="h-6 w-6 text-white" />
              </span>
              {/* progress bar */}
              <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/10">
                <div className="h-full w-1/3 bg-gradient-to-r from-brand-purple to-brand-blue" />
              </div>
            </div>

            {/* Control bar */}
            <div className="flex items-center gap-2 px-4 py-3">
              <Button type="button" variant="ghost" size="icon" aria-label="Skip back" className="text-muted-foreground hover:text-foreground">
                <SkipBack className="h-[1.1rem] w-[1.1rem]" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Pause" className="text-foreground">
                <Pause className="h-[1.1rem] w-[1.1rem]" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Skip forward" className="text-muted-foreground hover:text-foreground">
                <SkipForward className="h-[1.1rem] w-[1.1rem]" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Volume" className="text-muted-foreground hover:text-foreground">
                <Volume2 className="h-[1.1rem] w-[1.1rem]" />
              </Button>
              <span className="ml-1 text-xs tabular-nums text-muted-foreground">00:48 / 02:24</span>
              <div className="ml-auto flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Subtitles" className="text-muted-foreground hover:text-foreground">
                  <Subtitles className="h-[1.1rem] w-[1.1rem]" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Settings" className="text-muted-foreground hover:text-foreground">
                  <Settings2 className="h-[1.1rem] w-[1.1rem]" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Fullscreen" className="text-muted-foreground hover:text-foreground">
                  <Maximize className="h-[1.1rem] w-[1.1rem]" />
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Metadata sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
        >
          <GlassCard className="flex h-full flex-col gap-4 p-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.14em] text-brand-purple-soft">
                Now playing
              </span>
              <h2 className="text-xl font-semibold text-foreground">Summer Roadtrip</h2>
              <p className="text-sm text-muted-foreground">1h 24m · 1080p · Added 3 days ago</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A placeholder description for the selected media. Metadata, chapters,
              and related items will appear here in a future phase.
            </p>
            <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
              {["Source: local library", "Codec: H.264 / AAC", "Bitrate: adaptive"].map((row) => (
                <div key={row} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{row.split(":")[0]}</span>
                  <span className="text-foreground/80">{row.split(":")[1]}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </Container>
  );
}
