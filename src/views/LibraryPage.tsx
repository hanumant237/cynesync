"use client";

/**
 * CineSync — Library page (placeholder)
 *
 * Professional placeholder layout for the user's private media library:
 * a page header with search/filter affordances and a responsive grid of
 * media card placeholders. No business logic in this phase.
 */

import { motion } from "framer-motion";
import { Filter, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/common/Container";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";

/** Placeholder library items (UI only). */
const LIBRARY_ITEMS: ReadonlyArray<{ title: string; meta: string }> = [
  { title: "Summer Roadtrip", meta: "1h 24m · 1080p" },
  { title: "Family Reunion 2024", meta: "42m · 4K" },
  { title: "Drone Footage — Coast", meta: "18m · 4K HDR" },
  { title: "Concert — Live Cut", meta: "2h 06m · 1080p" },
  { title: "Wedding Highlights", meta: "35m · 4K" },
  { title: "Mountain Timelapse", meta: "12m · 4K" },
  { title: "City Walk — 4K", meta: "1h 02m · 4K" },
  { title: "Anniversary Edit", meta: "28m · 1080p" },
];

export function LibraryPage() {
  return (
    <Container className="flex flex-1 flex-col gap-10 py-12">
      <PageHeader
        eyebrow="Your collection"
        title="Private"
        titleGradient="Library"
        description="Every video you own or are authorized to access, organized in one beautiful place."
        actions={
          <Button
            type="button"
            className="h-10 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 text-sm text-white shadow-[0_6px_20px_rgba(139,92,246,0.3)]"
          >
            <Plus className="h-4 w-4" />
            Add media
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search your library…"
            aria-label="Search your library"
            className="h-11 rounded-xl border-white/10 bg-white/5 pl-10 text-sm placeholder:text-muted-foreground focus-visible:border-brand-purple/50 focus-visible:ring-brand-purple/30"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl border-white/15 bg-white/5 px-4 text-sm text-foreground hover:bg-white/10"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {LIBRARY_ITEMS.map((item, i) => (
          <motion.button
            key={item.title}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
            className="group text-left"
          >
            <GlassCard interactive className="overflow-hidden">
              <div className="relative flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-brand-purple/15 via-card to-brand-blue/15">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur transition-colors group-hover:bg-brand-purple/80">
                  <span className="h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-white" />
                </span>
                <span className="absolute bottom-2 right-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur">
                  {item.meta.split("·")[0].trim()}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3">
                <span className="truncate text-sm font-medium text-foreground">
                  {item.title}
                </span>
                <span className="text-xs text-muted-foreground">{item.meta}</span>
              </div>
            </GlassCard>
          </motion.button>
        ))}
      </div>
    </Container>
  );
}
