/**
 * CineSync Backend — Logger
 *
 * A tiny, dependency-free leveled logger. Writes formatted, color-free lines
 * to stdout/stderr so they are easy to capture in any environment. Every
 * streaming-lifecycle event (request, detection, start, stop, error) flows
 * through here for consistent, greppable output.
 */

import { config } from "../config/index.js";

export type LogLevel = "silly" | "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  silly: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

const MIN_LEVEL = LEVEL_ORDER[config.logLevel] ?? LEVEL_ORDER.info;

/** ISO timestamp with milliseconds, for log lines. */
function timestamp(): string {
  return new Date().toISOString();
}

/** Render a structured context object inline, if present. */
function renderContext(ctx?: Record<string, unknown>): string {
  if (!ctx) return "";
  try {
    return " " + JSON.stringify(ctx);
  } catch {
    return "";
  }
}

function log(level: LogLevel, scope: string, msg: string, ctx?: Record<string, unknown>): void {
  if (LEVEL_ORDER[level] < MIN_LEVEL) return;
  const line = `[${timestamp()}] [${level.toUpperCase()}] [${scope}] ${msg}${renderContext(ctx)}`;
  if (level === "error" || level === "warn") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

/**
 * Scoped logger. Create one per service: `new Logger("MediaInspector")`.
 * Keeps log lines identifiable without repeating the scope each call.
 */
export class Logger {
  constructor(private readonly scope: string) {}

  silly(msg: string, ctx?: Record<string, unknown>): void {
    log("silly", this.scope, msg, ctx);
  }
  debug(msg: string, ctx?: Record<string, unknown>): void {
    log("debug", this.scope, msg, ctx);
  }
  info(msg: string, ctx?: Record<string, unknown>): void {
    log("info", this.scope, msg, ctx);
  }
  warn(msg: string, ctx?: Record<string, unknown>): void {
    log("warn", this.scope, msg, ctx);
  }
  error(msg: string, ctx?: Record<string, unknown>): void {
    log("error", this.scope, msg, ctx);
  }
}
