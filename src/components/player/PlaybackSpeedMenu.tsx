"use client";

/**
 * CineSync — PlaybackSpeedMenu
 *
 * Reusable playback-rate selector. Renders the current speed as a button;
 * clicking opens a small glassmorphism menu of available rates. Closes on
 * outside click / escape / selection.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAYBACK_RATES } from "@/utils/player";

export interface PlaybackSpeedMenuProps {
  rate: number;
  onChange: (rate: number) => void;
}

export function PlaybackSpeedMenu({ rate, onChange }: PlaybackSpeedMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on outside click or escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Playback speed: ${rate}x`}
        className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Gauge className="h-[1.15rem] w-[1.15rem]" />
        <span className="tabular-nums">{rate}x</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="glass absolute bottom-12 right-0 z-20 w-32 overflow-hidden rounded-xl p-1 shadow-2xl"
          >
            {PLAYBACK_RATES.map((value) => {
              const active = Math.abs(value - rate) < 0.001;
              return (
                <button
                  key={value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    onChange(value);
                    close();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <span className="tabular-nums">{value}x</span>
                  {active ? <Check className="h-3.5 w-3.5 text-brand-purple-soft" /> : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
