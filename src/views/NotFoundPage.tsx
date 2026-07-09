"use client";

/**
 * CineSync — Not Found (404) page
 *
 * Shown when the in-app view router cannot resolve a requested view
 * (e.g. an unknown URL hash). Premium centered layout with a gradient mark.
 */

import { motion } from "framer-motion";
import { Compass, Home } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/Container";
import { GradientText } from "@/components/common/GradientText";

export function NotFoundPage() {
  const { navigate } = useNavigation();

  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center gap-5"
      >
        <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue shadow-[0_10px_40px_rgba(139,92,246,0.4)]">
          <Compass className="h-9 w-9 text-white" />
        </span>

        <h1 className="text-6xl font-semibold tracking-tight sm:text-7xl">
          <GradientText>404</GradientText>
        </h1>
        <div className="flex flex-col gap-2">
          <p className="text-xl font-medium text-foreground">Page not found</p>
          <p className="max-w-md text-sm text-muted-foreground">
            The view you're looking for doesn't exist or has moved. Let's get you
            back to your library.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => navigate("home")}
            className="h-11 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-6 text-sm text-white shadow-[0_6px_20px_rgba(139,92,246,0.35)]"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("library")}
            className="h-11 rounded-xl border-white/15 bg-white/5 px-6 text-sm text-foreground hover:bg-white/10"
          >
            Open Library
          </Button>
        </div>
      </motion.div>
    </Container>
  );
}
