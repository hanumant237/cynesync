"use client";

/**
 * CineSync — Watch Party page (placeholder)
 *
 * Professional placeholder layout for synchronized viewing: a main 16:9
 * surface, a participants strip, and a chat sidebar. No realtime/socket logic
 * in this phase.
 */

import { motion } from "framer-motion";
import { MessageSquare, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/common/Container";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";

/** Placeholder participants. */
const PARTICIPANTS: ReadonlyArray<{ name: string; initial: string; you?: boolean }> = [
  { name: "You", initial: "Y", you: true },
  { name: "Alex", initial: "A" },
  { name: "Sam", initial: "S" },
  { name: "Jordan", initial: "J" },
];

/** Placeholder chat messages. */
const CHAT: ReadonlyArray<{ from: string; text: string; mine?: boolean }> = [
  { from: "Alex", text: "Starting in 5!" },
  { from: "Sam", text: "ready 🍿" },
  { from: "You", text: "hit play", mine: true },
];

export function WatchPartyPage() {
  return (
    <Container className="flex flex-1 flex-col gap-8 py-10">
      <PageHeader
        eyebrow="In sync"
        title="Watch"
        titleGradient="Party"
        description="Watch together in real time. Shared playback keeps everyone on the same frame."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main viewing area */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-col gap-4"
        >
          <GlassCard className="overflow-hidden p-0">
            <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-brand-blue/10 via-black/40 to-brand-purple/10">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                <span className="h-0 w-0 border-y-[8px] border-l-[12px] border-y-transparent border-l-white" />
              </span>
              <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/10">
                <div className="h-full w-2/5 bg-gradient-to-r from-brand-purple to-brand-blue" />
              </div>
            </div>
          </GlassCard>

          {/* Participants strip */}
          <GlassCard className="flex items-center gap-3 p-4">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              {PARTICIPANTS.length} watching
            </span>
            <div className="ml-auto flex -space-x-2">
              {PARTICIPANTS.map((p) => (
                <span
                  key={p.name}
                  title={p.name}
                  className={
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-xs font-semibold " +
                    (p.you
                      ? "bg-gradient-to-br from-brand-purple to-brand-blue text-white"
                      : "bg-white/10 text-foreground/80")
                  }
                >
                  {p.initial}
                </span>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Chat sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
        >
          <GlassCard className="flex h-[480px] flex-col p-0 lg:h-full">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
              <MessageSquare className="h-4 w-4 text-brand-purple-soft" />
              <span className="text-sm font-medium text-foreground">Party chat</span>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
              {CHAT.map((msg, i) => (
                <div key={i} className={"flex flex-col gap-1 " + (msg.mine ? "items-end" : "items-start")}>
                  <span className="text-[11px] text-muted-foreground">{msg.from}</span>
                  <span
                    className={
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                      (msg.mine
                        ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white"
                        : "bg-white/5 text-foreground/90")
                    }
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-center gap-2 border-t border-white/10 p-3"
            >
              <Input
                placeholder="Say something…"
                aria-label="Chat message"
                className="h-10 rounded-xl border-white/10 bg-white/5 text-sm placeholder:text-muted-foreground focus-visible:border-brand-purple/50 focus-visible:ring-brand-purple/30"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send"
                className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </Container>
  );
}
