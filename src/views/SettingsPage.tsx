"use client";

/**
 * CineSync — Settings page (placeholder)
 *
 * Professional placeholder layout: grouped settings sections rendered as glass
 * cards (Appearance, Playback, Account). All controls are non-functional
 * placeholders in this phase.
 */

import { motion } from "framer-motion";
import { Monitor, Moon, Palette, UserCog, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Container } from "@/components/common/Container";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";

/** A single toggle row inside a settings section. */
function ToggleRow({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <Switch defaultChecked={defaultChecked} aria-label={label} />
    </div>
  );
}

export function SettingsPage() {
  return (
    <Container className="flex flex-1 flex-col gap-8 py-12">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Make CineSync yours. These controls are placeholders for now — real preferences arrive in a future phase."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <GlassCard className="flex h-full flex-col gap-1 p-6">
            <div className="mb-2 flex items-center gap-2">
              <Palette className="h-4 w-4 text-brand-purple-soft" />
              <h2 className="text-base font-semibold text-foreground">Appearance</h2>
            </div>
            <ToggleRow
              label="Dark theme"
              description="CineSync is designed dark by default."
              defaultChecked
            />
            <div className="my-1 h-px bg-white/10" />
            <ToggleRow label="Reduce motion" description="Minimize animations across the app." />
            <div className="my-1 h-px bg-white/10" />
            <div className="flex items-center justify-between gap-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">Accent</span>
                <span className="text-xs text-muted-foreground">Purple · Blue gradient</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-brand-purple ring-2 ring-white/20" />
                <span className="h-5 w-5 rounded-full bg-brand-blue ring-2 ring-white/20" />
                <Monitor className="ml-1 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Playback */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06, ease: "easeOut" }}
        >
          <GlassCard className="flex h-full flex-col gap-1 p-6">
            <div className="mb-2 flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-brand-blue-soft" />
              <h2 className="text-base font-semibold text-foreground">Playback</h2>
            </div>
            <ToggleRow label="Autoplay next" description="Continue to the next video automatically." defaultChecked />
            <div className="my-1 h-px bg-white/10" />
            <ToggleRow label="Skip intros" description="Jump past detected intro sequences." />
            <div className="my-1 h-px bg-white/10" />
            <ToggleRow label="Default subtitles" description="Show subtitles when available." defaultChecked />
          </GlassCard>
        </motion.div>

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
          className="lg:col-span-2"
        >
          <GlassCard className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-brand-purple-soft" />
              <h2 className="text-base font-semibold text-foreground">Account</h2>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-sm font-semibold text-white">
                  CS
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">CineSync Member</span>
                  <span className="text-xs text-muted-foreground">Signed in locally · No account required yet</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl border-white/15 bg-white/5 px-4 text-sm text-foreground hover:bg-white/10"
                >
                  <Moon className="h-4 w-4" />
                  Export data
                </Button>
                <Button
                  type="button"
                  className="h-9 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 text-sm text-white"
                >
                  Manage
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </Container>
  );
}
