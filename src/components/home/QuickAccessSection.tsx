"use client";

/**
 * CineSync — QuickAccessSection
 *
 * Lets a user paste a video URL and jump straight to the Player. Below the
 * input is a "Recent videos" placeholder row (static placeholders only — no
 * business logic in this phase).
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Play } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/common/Container";
import { GlassCard } from "@/components/common/GlassCard";
import { SectionHeading } from "@/components/common/SectionHeading";

/** Static placeholder recent videos (UI only). */
const RECENT_VIDEOS: ReadonlyArray<{ title: string; meta: string }> = [
  { title: "Summer Roadtrip", meta: "1h 24m · 1080p" },
  { title: "Family Reunion 2024", meta: "42m · 4K" },
  { title: "Drone Footage — Coast", meta: "18m · 4K HDR" },
];

export function QuickAccessSection() {
  const { navigate } = useNavigation();
  const [url, setUrl] = useState("");

  return (
    <section className="relative py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Quick Access"
          title="Paste a link and"
          titleGradient="press play"
          description="Drop in any video URL you own or are authorized to access. CineSync handles the rest — no uploads, no waiting."
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <GlassCard className="p-2 sm:p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate("player");
              }}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-[1.15rem] w-[1.15rem] -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="url"
                  inputMode="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…  paste a video URL"
                  aria-label="Video URL"
                  className="h-12 rounded-xl border-transparent bg-white/5 pl-11 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-brand-purple/50 focus-visible:ring-brand-purple/30"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-6 text-sm font-medium text-white shadow-[0_8px_24px_rgba(139,92,246,0.35)] transition-transform duration-200 hover:scale-[1.02]"
              >
                <Play className="h-4 w-4" />
                Play
              </Button>
            </form>
          </GlassCard>
        </motion.div>

        {/* Recent videos placeholder */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Recent videos</h3>
            <button
              type="button"
              onClick={() => navigate("library")}
              className="text-xs text-brand-purple-soft transition-colors hover:text-foreground"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {RECENT_VIDEOS.map((video, i) => (
              <motion.button
                key={video.title}
                type="button"
                onClick={() => navigate("player")}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
                className="group text-left"
              >
                <GlassCard interactive className="overflow-hidden">
                  {/* Thumbnail placeholder */}
                  <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-brand-purple/15 via-card to-brand-blue/15">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur transition-colors group-hover:bg-brand-purple/80">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-4">
                    <span className="truncate text-sm font-medium text-foreground">
                      {video.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{video.meta}</span>
                  </div>
                </GlassCard>
              </motion.button>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
