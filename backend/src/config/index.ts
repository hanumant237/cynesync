/**
 * CineSync Backend — Application Configuration
 *
 * Loads environment variables and exposes a single typed `config` object.
 */

import dotenv from "dotenv";

dotenv.config();

export const config = {
  /** Port the Express + Socket.IO server listens on. */
  port: Number(process.env.PORT ?? 4001),
  /** Comma-separated list of allowed CORS origins. */
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(","),
  /** Directory containing media the user owns or is authorized to access. */
  mediaRoot: process.env.MEDIA_ROOT ?? "./media",
  /** Node environment. */
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;

export type AppConfig = typeof config;
