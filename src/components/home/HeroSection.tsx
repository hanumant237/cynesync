"use client";

/**
 * CineSync — HeroSection
 *
 * Home page hero: large headline ("Your Personal Streaming Platform"), a short
 * description, a primary and a secondary CTA, over a layered purple→blue
 * gradient glow. Entrance animations are staggered via Framer Motion.
 */

import { motion, type Variants } from "framer-motion";
import { ArrowRight, Library, Play } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { HERO_HEADLINE } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/Container";
import { GradientText } from "@/components/common/GradientText";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function HeroSection() {
  const { navigate } = useNavigation();

  return (
    <section className="relative overflow-hidden">
      {/* Dotted grid texture + bottom fade */}
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />

      <Container className="relative flex flex-col items-center pb-16 pt-20 text-center sm:pt-28 md:pb-24 md:pt-32">
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center gap-6">
          {/* Eyebrow pill */}
          <motion.div variants={item}>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" />
              Premium personal streaming, reimagined
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {HERO_HEADLINE.split(" ").slice(0, 2).join(" ")}{" "}
            <GradientText>{HERO_HEADLINE.split(" ").slice(2).join(" ")}</GradientText>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={item}
            className="max-w-2xl text-base text-muted-foreground sm:text-lg"
          >
            Bring together every video you own or are authorized to access. A
            beautiful, private home for your library — watch solo or in sync with
            friends, anywhere, on any device.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="flex flex-col items-center gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              onClick={() => navigate("library")}
              className="h-12 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-7 text-sm font-medium text-white shadow-[0_8px_32px_rgba(139,92,246,0.35)] transition-transform duration-200 hover:scale-[1.03] hover:shadow-[0_10px_40px_rgba(139,92,246,0.5)]"
            >
              <Library className="h-4 w-4" />
              Explore Library
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => navigate("player")}
              className="h-12 rounded-xl border-white/15 bg-white/5 px-7 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-white/10"
            >
              <Play className="h-4 w-4" />
              Open Player
            </Button>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            variants={item}
            className="glass mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl px-6 py-4 text-sm sm:gap-x-12"
          >
            {[
              { value: "4K", label: "Universal playback" },
              { value: "∞", label: "Your library" },
              { value: "0", label: "Ads" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-foreground">{stat.value}</span>
                <span className="text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Scroll hint */}
          <motion.div variants={item} className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowRight className="h-3.5 w-3.5 rotate-90 animate-bounce" />
            Discover what CineSync can do
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
