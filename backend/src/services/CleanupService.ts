/**
 * CineSync Backend — CleanupService
 *
 * Owns teardown of stream sessions: stops the FFmpeg process and removes the
 * temporary HLS directory so no files are ever left behind. Also schedules
 * idle-session reaping so abandoned sessions don't leak disk over time.
 *
 * Design goal: "never leave temporary files behind." Every code path that
 * creates a session directory must also route through this service to remove
 * it — on stop, on idle timeout, and on process shutdown.
 */

import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { config } from "../config/index.js";
import { Logger } from "./Logger.js";

const log = new Logger("CleanupService");

/** A registered stream session the cleanup service can tear down. */
export interface RegisteredSession {
  id: string;
  /** Absolute path to the session's HLS output directory. */
  outDir: string;
  /** Stop the underlying FFmpeg process, if running. */
  stop: () => void;
  /** Update this to track the last activity time (ms epoch). */
  lastActivity: number;
}

export class CleanupService {
  private sessions = new Map<string, RegisteredSession>();
  private reaper: NodeJS.Timeout | null = null;

  constructor() {
    // Reap idle sessions every minute.
    this.reaper = setInterval(() => this.reapIdle(), 60_000);
    // Don't keep the process alive just for reaping.
    this.reaper.unref?.();
  }

  /** Register a session for lifecycle management. */
  register(session: RegisteredSession): void {
    this.sessions.set(session.id, session);
    log.debug("Session registered", { id: session.id, outDir: session.outDir });
  }

  /** Record that a session is still active (e.g. serving a segment). */
  touch(id: string): void {
    const s = this.sessions.get(id);
    if (s) s.lastActivity = Date.now();
  }

  /** Stop the FFmpeg process for a session and remove its temp directory. */
  async dispose(id: string): Promise<void> {
    const s = this.sessions.get(id);
    if (!s) {
      log.debug("Dispose called for unknown session", { id });
      return;
    }

    try {
      s.stop();
    } catch (err) {
      log.warn("Error stopping FFmpeg process", { id, error: (err as Error).message });
    }

    await this.removeDir(s.outDir);
    this.sessions.delete(id);
    log.info("Session disposed", { id });
  }

  /** Remove idle sessions whose TTL has elapsed. */
  reapIdle(): void {
    const now = Date.now();
    for (const [id, s] of this.sessions) {
      if (now - s.lastActivity > config.hlsSessionTtlMs) {
        log.info("Reaping idle session", { id, idleMs: now - s.lastActivity });
        void this.dispose(id);
      }
    }
  }

  /** Dispose every active session — used on server shutdown. */
  async disposeAll(): Promise<void> {
    log.info("Disposing all sessions", { count: this.sessions.size });
    const ids = [...this.sessions.keys()];
    await Promise.allSettled(ids.map((id) => this.dispose(id)));
    if (this.reaper) {
      clearInterval(this.reaper);
      this.reaper = null;
    }
  }

  /** Remove a directory tree, ignoring "not found" errors. Public for ad-hoc cleanup. */
  async removeDir(dir: string): Promise<void> {
    if (!existsSync(dir)) return;
    try {
      await rm(dir, { recursive: true, force: true });
      log.debug("Removed temp dir", { dir });
    } catch (err) {
      log.error("Failed to remove temp dir", { dir, error: (err as Error).message });
    }
  }
}
