/**
 * CineSync Backend — PlaybackSync
 *
 * Applies host playback controls (play / pause / seek / speed / video change)
 * to a room's authoritative playback state, anchored to a server timestamp.
 * Provides latency-compensation helpers so participants can compute the
 * correct expected position at the current moment.
 *
 * All mutations go through this service so the state always stays consistent
 * and timestamped. RoomEvents calls these methods, then broadcasts the
 * resulting state via SocketManager.
 */

import { config } from "../config/index.js";
import { Logger } from "./Logger.js";
import type {
  PlaybackState,
  PlaybackSyncState,
  Room,
} from "../types/watchParty.js";

const log = new Logger("PlaybackSync");

export class PlaybackSync {
  /**
   * Compute the expected playback position (seconds) at the current server
   * time, accounting for elapsed time since `lastUpdatedAt` when playing.
   *
   * This is the latency-compensation core: every participant can call this
   * with the room's last-known state and get a position that matches the
   * host's actual playback, even across network delays.
   */
  computeCurrentPosition(playback: PlaybackSyncState, now: number = Date.now()): number {
    if (playback.state !== "playing") return playback.position;
    const elapsedSec = (now - playback.lastUpdatedAt) / 1000;
    return Math.max(0, playback.position + elapsedSec * playback.speed);
  }

  /** Host pressed play. Anchors the current position to now. */
  applyPlay(room: Room, position: number): PlaybackSyncState {
    const now = Date.now();
    room.playback = {
      position: this.clampPosition(position),
      state: "playing",
      speed: room.playback.speed,
      lastUpdatedAt: now,
    };
    room.lastActivityAt = now;
    log.info("Host play", { code: room.code, position: room.playback.position });
    return room.playback;
  }

  /** Host pressed pause. Freezes the current position. */
  applyPause(room: Room, position: number): PlaybackSyncState {
    const now = Date.now();
    room.playback = {
      position: this.clampPosition(position),
      state: "paused",
      speed: room.playback.speed,
      lastUpdatedAt: now,
    };
    room.lastActivityAt = now;
    log.info("Host pause", { code: room.code, position: room.playback.position });
    return room.playback;
  }

  /** Host seeked to a new position. Keeps current play/paused state. */
  applySeek(room: Room, position: number): PlaybackSyncState {
    const now = Date.now();
    room.playback = {
      position: this.clampPosition(position),
      state: room.playback.state,
      speed: room.playback.speed,
      lastUpdatedAt: now,
    };
    room.lastActivityAt = now;
    log.info("Host seek", { code: room.code, position: room.playback.position });
    return room.playback;
  }

  /** Host changed playback speed. Re-anchors position to now. */
  applySpeed(room: Room, speed: number): PlaybackSyncState {
    if (!this.isValidSpeed(speed)) {
      log.warn("Rejected invalid speed", { code: room.code, speed });
      return room.playback;
    }
    const now = Date.now();
    // Capture the current position before applying the new speed so playback
    // doesn't jump when speed changes mid-play.
    const currentPosition = this.computeCurrentPosition(room.playback, now);
    room.playback = {
      position: this.clampPosition(currentPosition),
      state: room.playback.state,
      speed,
      lastUpdatedAt: now,
    };
    room.lastActivityAt = now;
    log.info("Host change-speed", { code: room.code, speed });
    return room.playback;
  }

  /** Host changed the video. Resets to a fresh paused state at position 0. */
  applyVideoChange(room: Room, videoUrl: string): PlaybackSyncState {
    const now = Date.now();
    room.videoUrl = videoUrl;
    room.playback = {
      position: 0,
      state: "paused",
      speed: 1,
      lastUpdatedAt: now,
    };
    room.lastActivityAt = now;
    log.info("Host change-video", { code: room.code });
    return room.playback;
  }

  /**
   * Build a sync snapshot for a participant that just joined or requested
   * re-sync. Anchors the position to the current server time so the client
   * can start at the right place.
   */
  buildSyncSnapshot(room: Room): PlaybackSyncState {
    const now = Date.now();
    // Re-anchor the position to "now" so the joining participant starts at
    // the correct frame.
    const currentPosition = this.computeCurrentPosition(room.playback, now);
    return {
      position: currentPosition,
      state: room.playback.state,
      speed: room.playback.speed,
      lastUpdatedAt: now,
    };
  }

  /** Whether a speed value is within the allowed range. */
  isValidSpeed(speed: number): boolean {
    return (
      Number.isFinite(speed) &&
      speed >= config.watchPartyMinSpeed &&
      speed <= config.watchPartyMaxSpeed
    );
  }

  /** Clamp a position to a non-negative finite number. */
  private clampPosition(position: number): number {
    if (!Number.isFinite(position) || position < 0) return 0;
    return position;
  }
}

/** Convenience type alias for the playback state union. */
export type { PlaybackState };
