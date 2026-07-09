/**
 * CineSync Backend — URL Utilities
 *
 * Helpers for validating and probing media URLs. Used by the stream
 * controller before any FFmpeg work happens, so bad input fails fast with a
 * friendly, structured error.
 */

import { URL } from "node:url";
import { config } from "../config/index.js";
import { Logger } from "../services/Logger.js";

const log = new Logger("UrlUtils");

/** Known video container extensions used for quick format hints. */
const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mkv",
  ".mov",
  ".webm",
  ".avi",
  ".mpeg",
  ".mpg",
  ".ts",
  ".m2ts",
  ".flv",
  ".wmv",
  ".m4v",
]);

/** Known HLS / DASH manifests. */
const MANIFEST_EXTENSIONS = new Set([".m3u8", ".mpd"]);

/** Result of validating a URL's basic shape. */
export interface UrlValidation {
  ok: boolean;
  /** Machine-readable error code when invalid. */
  code?: string;
  /** Friendly message when invalid. */
  reason?: string;
  /** The normalized URL when valid. */
  url?: string;
  /** Best-effort file extension hint (lowercase, with dot). */
  ext?: string;
}

/**
 * Validate the shape of a URL string: must be a non-empty http(s) URL.
 * Does NOT touch the network — that's what `probeUrl` is for.
 */
export function validateUrl(raw: string): UrlValidation {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { ok: false, code: "INVALID_URL", reason: "A URL is required." };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return {
      ok: false,
      code: "INVALID_URL",
      reason: "That doesn't look like a valid URL.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      ok: false,
      code: "INVALID_URL",
      reason: "Only http and https URLs are supported.",
    };
  }

  const ext = extFromPathname(parsed.pathname);
  return { ok: true, url: parsed.toString(), ext };
}

/** Extract a lowercase extension (with dot) from a URL pathname. */
export function extFromPathname(pathname: string): string | undefined {
  const slash = pathname.lastIndexOf("/");
  const file = slash >= 0 ? pathname.slice(slash + 1) : pathname;
  const dot = file.lastIndexOf(".");
  if (dot < 0) return undefined;
  return file.slice(dot).toLowerCase();
}

/** Whether an extension hint looks like a video container or manifest. */
export function isLikelyMediaExtension(ext?: string): boolean {
  if (!ext) return false;
  return VIDEO_EXTENSIONS.has(ext) || MANIFEST_EXTENSIONS.has(ext);
}

export interface UrlProbeResult {
  reachable: boolean;
  /** HTTP status code from the probe, if a response was received. */
  status?: number;
  /** Content-Type header, when present. */
  contentType?: string;
  /** Content-Length header parsed to bytes, when present. */
  contentLength?: number;
  /** True when the response looks like video (by extension or content-type). */
  looksLikeVideo: boolean;
  /** Error code + message when not reachable. */
  code?: string;
  reason?: string;
}

/**
 * Probe a URL with a small GET (range request) to confirm it is reachable and
 * to read its Content-Type. Uses AbortController to enforce a timeout.
 */
export async function probeUrl(url: string): Promise<UrlProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    config.urlProbeTimeoutMs,
  );

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      // Request only a tiny slice — we only need headers + content-type.
      headers: { Range: "bytes=0-1" },
      redirect: "follow",
    });

    const contentType = res.headers.get("content-type") ?? undefined;
    const contentLengthHeader = res.headers.get("content-length") ?? undefined;
    const contentLength = contentLengthHeader
      ? Number.parseInt(contentLengthHeader, 10)
      : undefined;

    // 200/206 are fine; some servers reject Range and return 200.
    const reachable = res.status === 200 || res.status === 206;
    const looksLikeVideo = looksLikeVideoContentType(contentType, url);

    if (!reachable) {
      return {
        reachable: false,
        status: res.status,
        contentType,
        looksLikeVideo,
        code: "UNREACHABLE_URL",
        reason: `The URL returned HTTP ${res.status}.`,
      };
    }

    log.debug("URL probe ok", {
      status: res.status,
      contentType,
      contentLength,
      looksLikeVideo,
    });

    return {
      reachable: true,
      status: res.status,
      contentType,
      contentLength,
      looksLikeVideo,
    };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      reachable: false,
      looksLikeVideo: false,
      code: isAbort ? "URL_TIMEOUT" : "UNREACHABLE_URL",
      reason: isAbort
        ? "The URL took too long to respond."
        : "The URL could not be reached.",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Heuristic: does the Content-Type or URL extension look like video? */
function looksLikeVideoContentType(contentType?: string, url?: string): boolean {
  if (contentType) {
    const ct = contentType.toLowerCase();
    if (ct.startsWith("video/")) return true;
    if (ct.includes("mpegurl")) return true; // application/vnd.apple.mpegurl
    if (ct.includes("octet-stream")) {
      // Fall through to extension check — octet-stream is ambiguous.
    } else {
      return false;
    }
  }
  if (url) {
    const ext = extFromPathname(new URL(url).pathname);
    return isLikelyMediaExtension(ext);
  }
  return false;
}
