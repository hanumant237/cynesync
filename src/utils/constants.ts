/**
 * CineSync — Constants
 *
 * Centralized configuration constants for the application.
 * Uses direct backend URL instead of gateway architecture.
 */

/** Base URL for all backend API requests and Socket.IO connections */
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

/** API base URL for HTTP requests */
export const API_BASE_URL = `${BACKEND_URL}/api`;
