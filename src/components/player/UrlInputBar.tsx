"use client";

/**
 * CineSync — UrlInputBar
 *
 * "Paste Video URL" + Play control that lives above the player. Validates the
 * URL format locally and shows a friendly message (success or error) before
 * handing the URL to the parent's onPlay callback.
 *
 * Deliberately NOT connected to the backend in this phase — it only performs a
 * client-side format check (see validateVideoUrl).
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Link2, Play, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateVideoUrl } from "@/utils/player";
import type { UrlValidationResult } from "@/types/player";

export interface UrlInputBarProps {
  /** Called with a valid URL when the user presses Play. */
  onPlay: (url: string) => void;
  /** Optional pre-filled value (e.g. the current sample stream). */
  defaultValue?: string;
}

export function UrlInputBar({ onPlay, defaultValue = "" }: UrlInputBarProps) {
  const [value, setValue] = useState(defaultValue);
  const [result, setResult] = useState<UrlValidationResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateVideoUrl(value);
    setResult(validation);
    if (validation.valid) {
      onPlay(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-[1.15rem] w-[1.15rem] -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            inputMode="url"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (result) setResult(null);
            }}
            placeholder="https://…  paste a video URL (.m3u8 / .mp4 / .webm)"
            aria-label="Video URL"
            className="h-12 rounded-xl border-white/10 bg-white/5 pl-11 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-brand-purple/50 focus-visible:ring-brand-purple/30"
          />
        </div>
        <Button
          type="submit"
          className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-6 text-sm font-medium text-white shadow-[0_8px_24px_rgba(139,92,246,0.35)] transition-transform duration-200 hover:scale-[1.02]"
        >
          <Play className="h-4 w-4" />
          Play
        </Button>
      </div>

      {/* Validation message */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key={result.valid ? "ok" : "err"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2 text-sm"
          >
            {result.valid ? (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-purple-soft" />
                <span className="text-muted-foreground">
                  Looks good — loading your stream.
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span className="text-red-300/90">{result.reason}</span>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
