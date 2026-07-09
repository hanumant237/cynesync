/**
 * CineSync Backend — MediaInspector
 *
 * Wraps FFprobe to produce a normalized `MediaInfo` object for any source URL.
 * Handles timeouts, missing binaries, and malformed output gracefully so the
 * caller always gets either a clean result or a typed error.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { config } from "../config/index.js";
import { Logger } from "./Logger.js";
import { extFromPathname } from "../utils/url.js";
import type { CodecStream, MediaInfo } from "../types/index.js";

const execFileAsync = promisify(execFile);
const log = new Logger("MediaInspector");

/** Raw FFprobe JSON output shape (only the fields we read). */
interface FfprobeOutput {
  format?: {
    filename?: string;
    format_name?: string;
    format_long_name?: string;
    duration?: string;
    bit_rate?: string;
    size?: string;
  };
  streams?: Array<{
    codec_type?: string;
    codec_name?: string;
    codec_long_name?: string;
    width?: number;
    height?: number;
    bit_rate?: string;
    r_frame_rate?: string;
    channels?: number;
    sample_rate?: string;
  }>;
}

/** Error thrown when inspection fails in a known, classifiable way. */
export class InspectionError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "InspectionError";
  }
}

/** Map a format_name (or extension) to a short, human container label. */
function containerLabel(formatName?: string, sourceUrl?: string): string {
  const raw = formatName ?? "";
  const ext = sourceUrl ? extFromPathname(new URL(sourceUrl).pathname) : undefined;

  if (raw.includes("matroska") || ext === ".mkv") return "MKV";
  if (raw.includes("mov,mp4") || ext === ".mp4" || ext === ".m4v") return "MP4";
  if (raw.includes("webm") || ext === ".webm") return "WebM";
  if (raw.includes("avi") || ext === ".avi") return "AVI";
  if (raw.includes("mpeg") || ext === ".mpeg" || ext === ".mpg") return "MPEG";
  if (raw.includes("mpegts") || ext === ".ts" || ext === ".m2ts") return "TS";
  if (raw.includes("flv") || ext === ".flv") return "FLV";
  if (raw.includes("asf") || ext === ".wmv") return "WMV";
  if (raw.includes("apple") && raw.includes("mpegurl")) return "HLS";
  if (ext === ".m3u8") return "HLS";
  return raw.split(",")[0]?.toUpperCase() ?? "UNKNOWN";
}

/** Convert a "num/den" frame rate string to a label like "1080p". */
function resolutionLabel(width?: number, height?: number): string | undefined {
  if (!height) return undefined;
  if (height >= 2160) return "4K";
  if (height >= 1440) return "1440p";
  if (height >= 1080) return "1080p";
  if (height >= 720) return "720p";
  if (height >= 480) return "480p";
  if (height >= 360) return "360p";
  return `${height}p`;
}

export class MediaInspector {
  /**
   * Inspect a media URL and return normalized metadata.
   * Throws `InspectionError` on any failure (timeout, missing binary, bad
   * output) so the controller can map it to a structured HTTP error.
   */
  async inspect(sourceUrl: string): Promise<MediaInfo> {
    log.info("Inspecting media", { url: sourceUrl });

    const args = [
      "-v",
      "error", // suppress verbose logs, surface only errors
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      sourceUrl,
    ];

    let stdout: string;
    try {
      const result = await execFileAsync(config.ffprobePath, args, {
        timeout: config.ffprobeTimeoutMs,
        maxBuffer: 4 * 1024 * 1024,
      });
      stdout = result.stdout;
    } catch (err) {
      throw this.classifyError(err, sourceUrl);
    }

    let parsed: FfprobeOutput;
    try {
      parsed = JSON.parse(stdout) as FfprobeOutput;
    } catch {
      throw new InspectionError(
        "INSPECTION_FAILED",
        "FFprobe returned unreadable output.",
        { sourceUrl },
      );
    }

    if (!parsed.streams || parsed.streams.length === 0) {
      throw new InspectionError(
        "UNSUPPORTED_FORMAT",
        "No media streams were found in the source.",
        { sourceUrl },
      );
    }

    const streams: CodecStream[] = parsed.streams.map((s) => ({
      codecType: s.codec_type ?? "unknown",
      codecName: s.codec_name ?? "unknown",
      codecLongName: s.codec_long_name,
      width: s.width,
      height: s.height,
      bitRate: s.bit_rate ? Number.parseInt(s.bit_rate, 10) : undefined,
      frameRate: s.r_frame_rate,
      channels: s.channels,
      sampleRate: s.sample_rate ? Number.parseInt(s.sample_rate, 10) : undefined,
    }));

    const video = streams.find((s) => s.codecType === "video");
    const audio = streams.find((s) => s.codecType === "audio");
    const width = video?.width;
    const height = video?.height;
    const resolution = resolutionLabel(width, height);

    const durationSeconds = parsed.format?.duration
      ? Number.parseFloat(parsed.format.duration)
      : 0;
    const bitRate = parsed.format?.bit_rate
      ? Number.parseInt(parsed.format.bit_rate, 10)
      : undefined;
    const size = parsed.format?.size
      ? Number.parseInt(parsed.format.size, 10)
      : undefined;
    const container = containerLabel(parsed.format?.format_name, sourceUrl);

    const info: MediaInfo = {
      sourceUrl,
      formatName: parsed.format?.format_name ?? "",
      formatLongName: parsed.format?.format_long_name,
      container,
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
      bitRate,
      size,
      streams,
      video,
      audio,
      width,
      height,
      resolution,
    };

    log.info("Media detected", {
      container,
      videoCodec: video?.codecName,
      audioCodec: audio?.codecName,
      resolution,
      durationSeconds: Math.round(info.durationSeconds),
      bitRate,
    });

    return info;
  }

  /** Convert a raw execFile error into a typed InspectionError. */
  private classifyError(err: unknown, sourceUrl: string): InspectionError {
    const e = err as NodeJS.ErrnoException & {
      code?: string | number;
      signal?: string;
      stderr?: string;
    };
    // Binary not found (ENOENT).
    if (e.code === "ENOENT" && e.path === config.ffprobePath) {
      return new InspectionError(
        "FFPROBE_MISSING",
        "FFprobe is not installed or not on PATH.",
      );
    }
    // Timed out (execFile sets signal "SIGTERM" on timeout).
    if (e.signal === "SIGTERM" || e.code === "ETIMEDOUT") {
      return new InspectionError(
        "INSPECTION_TIMEOUT",
        "Inspecting the media took too long.",
        { sourceUrl },
      );
    }
    // FFprobe exited non-zero — usually an unsupported/invalid source.
    const stderr = e.stderr ?? "";
    return new InspectionError(
      "UNSUPPORTED_FORMAT",
      "The media could not be read. It may be an unsupported format or an unreachable URL.",
      { sourceUrl, stderr: stderr.slice(0, 500) },
    );
  }
}
