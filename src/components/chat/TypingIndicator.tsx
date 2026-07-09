"use client";

/**
 * CineSync — TypingIndicator
 *
 * Animated "X is typing…" indicator with bouncing dots. Shown above the
 * chat input when other users are typing.
 */

import { motion } from "framer-motion";

export function TypingIndicator({ usernames }: { usernames: string[] }) {
  if (usernames.length === 0) return null;

  const label =
    usernames.length === 1
      ? `${usernames[0]} is typing`
      : usernames.length === 2
        ? `${usernames[0]} and ${usernames[1]} are typing`
        : `${usernames.length} people are typing`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 px-1 text-xs text-muted-foreground"
    >
      <span className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1 w-1 rounded-full bg-brand-purple-soft"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </span>
      <span>{label}…</span>
    </motion.div>
  );
}
