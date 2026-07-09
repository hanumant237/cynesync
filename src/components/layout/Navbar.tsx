"use client";

/**
 * CineSync — Navbar
 *
 * Premium top navigation: brand logo, primary nav (Home / Library / Watch
 * Party / Settings), a search affordance, and a profile placeholder. Fully
 * responsive — collapses to a slide-down glass menu on mobile.
 *
 * Navigation is performed via the in-app NavigationContext (hash-synced) so no
 * additional server routes are created.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, User, X } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { NAV_ITEMS } from "@/utils/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/common/Container";
import { Logo } from "@/components/common/Logo";

export function Navbar() {
  const { view, navigate } = useNavigation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Frosted glass bar */}
      <div className="glass border-b border-white/10">
        <Container className="flex h-16 items-center gap-4">
          <Logo />

          {/* Desktop nav */}
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  {active ? (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Search"
              className="text-muted-foreground hover:text-foreground"
            >
              <Search className="h-[1.15rem] w-[1.15rem]" />
            </Button>

            <button
              type="button"
              aria-label="Profile"
              className="hidden items-center justify-center rounded-full border border-white/10 bg-white/5 p-0.5 text-muted-foreground transition-colors hover:border-brand-purple/50 hover:text-foreground sm:inline-flex"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple/80 to-brand-blue/80">
                <User className="h-4 w-4 text-white" />
              </span>
            </button>

            {/* Mobile menu toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </Container>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden"
          >
            <Container className="pt-3 pb-4">
              <nav className="glass flex flex-col gap-1 rounded-2xl p-2" aria-label="Mobile">
                {NAV_ITEMS.map((item) => {
                  const active = view === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        navigate(item.id);
                        setMobileOpen(false);
                      }}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-white/5 text-foreground"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
