/**
 * CineSync — Constants
 *
 * Centralized configuration constants for the application.
 * Uses direct backend URL instead of gateway architecture.
 */

/** Application metadata */
export const APP_NAME = "CineSync";
export const APP_TAGLINE = "Your media. Your stream. In sync.";
export const APP_VERSION = "0.1.0";

/** Hero section content */
export const HERO_HEADLINE = "Your Personal Streaming Platform";

/** Navigation items */
export const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "library", label: "Library" },
  { id: "watch-party", label: "Watch Party" },
  { id: "settings", label: "Settings" },
] as const;

/** Storage keys */
export const LAST_VIEW_STORAGE_KEY = "cinesync:last-view";

/** Base URL for all backend API requests and Socket.IO connections */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001";

/** API base URL for HTTP requests */
export const API_BASE_URL = `${BACKEND_URL}/api`;

/** Socket.IO base URL */
export const SOCKET_BASE_URL = BACKEND_URL;

/** Backend port (for development / compatibility) */
export const BACKEND_PORT = 4001;