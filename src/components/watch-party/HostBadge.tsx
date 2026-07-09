"use client";

/**
 * CineSync — HostBadge
 *
 * Small gradient pill that marks the room host. Reused in ParticipantCard
 * and RoomHeader.
 */

import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function HostBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-brand-purple/30 bg-brand-purple/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-purple-soft",
        className,
      )}
    >
      <Crown className="h-2.5 w-2.5" />
      Host
    </span>
  );
}
