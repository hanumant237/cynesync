"use client";

/**
 * CineSync — Application Providers
 *
 * Wraps all client-side context providers so the root layout stays simple.
 * Add new providers here as the app grows (theme, auth, query client, ...).
 */

import { NavigationProvider } from "@/context/NavigationContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <NavigationProvider>{children}</NavigationProvider>;
}
