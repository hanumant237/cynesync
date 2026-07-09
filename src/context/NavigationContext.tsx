"use client";

/**
 * CineSync — Navigation Context
 *
 * Provides lightweight, client-side view switching within the single `/` route.
 * The active view is mirrored to the URL hash (`#home`, `#player`, ...) so it
 * is shareable, survives refreshes, and allows unknown hashes to resolve to
 * the NotFound view (the in-app 404).
 *
 * Note: This intentionally does NOT create additional Next.js routes. All
 * views render inside `src/app/page.tsx`.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { NavigationContextValue, ViewId } from "@/types/navigation";
import { LAST_VIEW_STORAGE_KEY } from "@/utils/constants";

/** Set of valid, non-error views that can be requested directly. */
const VALID_VIEWS: ReadonlySet<ViewId> = new Set<ViewId>([
  "home",
  "library",
  "player",
  "watch-party",
  "settings",
]);

/** Default view shown on first load and when no hash is present. */
const DEFAULT_VIEW: ViewId = "home";

/**
 * Resolve a raw hash string (e.g. "#player" or "player") to a ViewId.
 * Unknown / empty values resolve to the NotFound view so the 404 page is
 * reachable via an invalid hash.
 */
function resolveView(rawHash: string): ViewId {
  const hash = rawHash.replace(/^#/, "").trim();
  if (!hash) return DEFAULT_VIEW;
  if (VALID_VIEWS.has(hash as ViewId)) return hash as ViewId;
  return "not-found";
}

/** Read the initial view from the URL hash (client-side only). */
function getInitialView(): ViewId {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  const fromHash = resolveView(window.location.hash);
  // Persist the last valid view so a refresh from a known page returns there.
  if (fromHash !== "not-found") {
    try {
      window.localStorage.setItem(LAST_VIEW_STORAGE_KEY, fromHash);
    } catch {
      /* storage unavailable — ignore */
    }
  }
  return fromHash;
}

export const NavigationContext =
  createContext<NavigationContextValue | null>(null);

/**
 * Provider that exposes the current view and a `navigate` function.
 * Listens to `hashchange` so browser back/forward stays in sync.
 */
export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<ViewId>(getInitialView);

  // Keep React state in sync with browser-driven hash changes (back/forward).
  useEffect(() => {
    const handleHashChange = () => setView(resolveView(window.location.hash));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = useCallback((next: ViewId) => {
    if (typeof window === "undefined") return;
    // Setting the hash triggers `hashchange`, which updates state.
    // Always assign even if identical so the URL reflects intent.
    const target = VALID_VIEWS.has(next) ? next : "not-found";
    if (window.location.hash !== `#${target}`) {
      window.location.hash = target;
    } else {
      setView(target);
    }
    if (target !== "not-found") {
      try {
        window.localStorage.setItem(LAST_VIEW_STORAGE_KEY, target);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const value = useMemo<NavigationContextValue>(
    () => ({ view, navigate }),
    [view, navigate],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
