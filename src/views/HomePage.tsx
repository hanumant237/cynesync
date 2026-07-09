"use client";

/**
 * CineSync — Home page
 *
 * Composes the hero, quick access, and features sections. No business logic —
 * pure presentation built from reusable section components.
 */

import { HeroSection } from "@/components/home/HeroSection";
import { QuickAccessSection } from "@/components/home/QuickAccessSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <QuickAccessSection />
      <FeaturesSection />
    </>
  );
}
