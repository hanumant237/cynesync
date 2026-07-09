"use client";

/**
 * CineSync — useNavigation hook
 *
 * Convenience accessor for the Navigation context. Throws if used outside a
 * NavigationProvider to surface integration mistakes early.
 */

import { useContext } from "react";
import { NavigationContext } from "@/context/NavigationContext";
import type { NavigationContextValue } from "@/types/navigation";

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return ctx;
}
