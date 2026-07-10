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

/**
 * Base backend URL used by services.
 */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

/** Legacy constant retained for compatibility. */
export const BACKEND_PORT = "4001";

/** LocalStorage key used to persist the last active view. */
export const LAST_VIEW_STORAGE_KEY = "cinesync:last-view";