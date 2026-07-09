"use client";

/**
 * CineSync — ChatInput
 *
 * Message input with a textarea. Enter sends, Shift+Enter inserts a newline.
 * Shows a character counter and disables when disconnected or sending.
 */

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAT_CONSTANTS } from "@/hooks/useChat";

export interface ChatInputProps {
  /** Whether the socket is connected (send disabled when false). */
  isConnected: boolean;
  /** Whether a send is in-flight. */
  isSending: boolean;
  /** Called with the trimmed message text on send. */
  onSend: (text: string) => void;
  /** Called on each keystroke (to emit typing indicator). */
  onTyping: () => void;
  /** Called when the user stops typing (blur or send). */
  onStopTyping: () => void;
}

export function ChatInput({
  isConnected,
  isSending,
  onSend,
  onTyping,
  onStopTyping,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const charCount = value.length;
  const isOverLimit = charCount > CHAT_CONSTANTS.MAX_MESSAGE_LENGTH;
  const isDisabled = !isConnected || isSending || isOverLimit;

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue("");
    onStopTyping();
    // Refocus + reset height.
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.focus();
      }
    });
  }, [value, isDisabled, onSend, onStopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (e.target.value.length > 0) {
      onTyping();
    } else {
      onStopTyping();
    }
    // Auto-resize the textarea.
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleBlur = () => {
    onStopTyping();
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={!isConnected}
          placeholder={isConnected ? "Type a message…" : "Reconnecting…"}
          rows={1}
          aria-label="Chat message"
          className={cn(
            "max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-brand-purple/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/30 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isDisabled}
          aria-label="Send message"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            isDisabled
              ? "cursor-not-allowed bg-white/5 text-muted-foreground/50"
              : "bg-gradient-to-r from-brand-purple to-brand-blue text-white hover:scale-105",
          )}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Character counter */}
      <div className="flex justify-end">
        <motion.span
          key={isOverLimit ? "over" : "ok"}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          className={cn(
            "text-[10px] tabular-nums",
            isOverLimit ? "text-red-400" : "text-muted-foreground/60",
          )}
        >
          {charCount}/{CHAT_CONSTANTS.MAX_MESSAGE_LENGTH}
        </motion.span>
      </div>
    </div>
  );
}
