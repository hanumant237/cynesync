"use client";

/**
 * CineSync — FeaturesSection
 *
 * Four premium glass feature cards: Universal Playback, Watch Party, Fast
 * Streaming, Private Library. Each card has an icon, title, and description,
 * with a hover lift + colored glow. Uses a shared config to avoid duplication.
 */

import { motion } from "framer-motion";
import { Gauge, Lock, PlayCircle, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { Container } from "@/components/common/Container";
import { GlassCard } from "@/components/common/GlassCard";
import { SectionHeading } from "@/components/common/SectionHeading";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: "purple" | "blue";
  /** Optional destination view when the card is clicked. */
  to?: "library" | "watch-party" | "player";
}

const FEATURES: ReadonlyArray<Feature> = [
  {
    icon: PlayCircle,
    title: "Universal Playback",
    description:
      "Play any video you own or are authorized to access. One player, every format, every device — beautifully.",
    accent: "purple",
    to: "player",
  },
  {
    icon: Users,
    title: "Watch Party",
    description:
      "Watch together in real time. Shared playback controls keep everyone on the same frame, effortlessly in sync.",
    accent: "blue",
    to: "watch-party",
  },
  {
    icon: Gauge,
    title: "Fast Streaming",
    description:
      "Adaptive, low-latency streaming designed for smooth playback. Start instantly, skip ahead, never buffer.",
    accent: "purple",
  },
  {
    icon: Lock,
    title: "Private Library",
    description:
      "Your media stays yours. A private, organized home for everything you own — nothing published, ever.",
    accent: "blue",
    to: "library",
  },
];

export function FeaturesSection() {
  const { navigate } = useNavigation();

  return (
    <section className="relative py-16 sm:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow="Why CineSync"
          title="Everything you need to"
          titleGradient="stream in style"
          description="A focused, premium toolkit for personal media. No clutter, no ads — just your videos, beautifully presented."
          align="center"
          className="mx-auto items-center"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            const isPurple = feature.accent === "purple";
            return (
              <motion.button
                key={feature.title}
                type="button"
                onClick={() => feature.to && navigate(feature.to)}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.07, ease: "easeOut" }}
                className="group h-full text-left"
              >
                <GlassCard interactive accent={feature.accent} className="flex h-full flex-col gap-4 p-6">
                  <span
                    className={
                      "inline-flex h-12 w-12 items-center justify-center rounded-xl border " +
                      (isPurple
                        ? "border-brand-purple/30 bg-brand-purple/10 text-brand-purple-soft"
                        : "border-brand-blue/30 bg-brand-blue/10 text-brand-blue-soft")
                    }
                  >
                    <Icon className="h-[1.35rem] w-[1.35rem]" />
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </GlassCard>
              </motion.button>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
