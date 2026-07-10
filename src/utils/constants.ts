/**
 * CineSync — Shared Constants
 *
 * Application-wide constants. Kept framework-agnostic so they can be imported
 * from both client and server code.
 */

/** Public application name shown in the UI and document title. */
export const APP_NAME = "CineSync";

/** Short tagline used in the footer and metadata. */
export const APP_TAGLINE = "Your media. Your stream. In sync.";

/** Hero headline shown on the Home page. */
export const HERO_HEADLINE = "Your Personal Streaming Platform";

/** Semantic application version. Bumped per release. */
export const APP_VERSION = "0.1.0";

/**
 * Primary navigation items rendered in the Navbar.
 * `player` is intentionally omitted — it is reached via the Play button and
 * the Quick Access panel rather than the primary nav.
 * Order here is the order shown in the UI.
 */
export const NAV_ITEMS: ReadonlyArray<{
  id: "home" | "library" | "watch-party" | "settings";
  label: string;
}> = [
  { id: "home", label: "Home" },
  { id: "library", label: "Library" },
  { id: "watch-party", label: "Watch Party" },
  { id: "settings", label: "Settings" },
];

/**
 * Base URL for the backend API.
 * Uses the Railway backend in production.
 */
export const API_BASE_URL =
  `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

/**
 * Base URL for Socket.IO.
 * Uses the Railway backend directly.
 */
export const SOCKET_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

/** Legacy constant retained for compatibility. */
export const BACKEND_PORT = "4001";

/** LocalStorage key used to persist the last active view. */
export const LAST_VIEW_STORAGE_KEY = "cinesync:last-view";