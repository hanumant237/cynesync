/**
 * CineSync Backend — URL Utilities
 *
 * Helpers for validating and probing media URLs. Used by the stream
 * controller before any FFmpeg work happens, so bad input fails fast with a
 * friendly, structured error.
 */

import { URL } from "node:url";
import { get as httpsGet } from "node:https";
import { get as httpGet } from "node:http";
import type { IncomingMessage } from "node:http";
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

// ---------------------------------------------------------------------------
// HTTP probe using node:http / node:https (stable on all platforms)
// ---------------------------------------------------------------------------

interface ProbeHttpResult {
  status: number;
  headers: IncomingMessage["headers"];
}

/**
 * Make an HTTP(S) GET request with redirect-following, returning the final
 * status code and headers. Uses node's core http/https modules instead of the
 * experimental fetch() to avoid DNS/TLS issues on Alpine (musl libc) with
 * Node 18's undici-based fetch.
 */
function probeHttp(
  url: string,
  timeoutMs: number,
  maxRedirects = 5,
): Promise<ProbeHttpResult> {
  return new Promise((resolve, reject) => {
    let redirects = 0;

    const attempt = (currentUrl: string) => {
      let parsed: URL;
      try {
        parsed = new URL(currentUrl);
      } catch (err) {
        reject(new Error(`Invalid redirect URL: ${currentUrl}`));
        return;
      }

      const getter = parsed.protocol === "https:" ? httpsGet : httpGet;

      const req = getter(
        currentUrl,
        {
          method: "GET",
          headers: {
            Range: "bytes=0-1",
            "User-Agent": "CineSync-Probe/1.0",
          },
        },
        (res) => {
          const status = res.statusCode ?? 0;

          // Follow redirects (301, 302, 303, 307, 308)
          if (
            [301, 302, 303, 307, 308].includes(status) &&
            res.headers.location &&
            redirects < maxRedirects
          ) {
            redirects++;
            res.resume(); // drain redirect response
            const nextUrl = new URL(res.headers.location, currentUrl).toString();
            log.debug("Following redirect", { from: currentUrl, to: nextUrl, redirectNum: redirects });
            attempt(nextUrl);
            return;
          }

          // Drain the response body to free memory.
          res.resume();

          resolve({ status, headers: res.headers });
        },
      );

      req.on("error", (err: NodeJS.ErrnoException) => {
        log.warn("HTTP probe request error", {
          url: currentUrl,
          code: err.code,
          message: err.message,
        });
        reject(err);
      });

      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error("URL_PROBE_TIMEOUT"));
      });
    };

    attempt(url);
  });
}

/**
 * Probe a URL with a small GET (range request) to confirm it is reachable and
 * to read its Content-Type. Uses node's core http/https modules (not fetch)
 * for maximum reliability across Node versions and platforms.
 */
export async function probeUrl(url: string): Promise<UrlProbeResult> {
  log.info("Probing URL", { url, timeoutMs: config.urlProbeTimeoutMs });

  try {
    const { status, headers } = await probeHttp(url, config.urlProbeTimeoutMs);

    const contentType = (headers["content-type"] as string) ?? undefined;
    const contentLengthHeader = (headers["content-length"] as string) ?? undefined;
    const contentLength = contentLengthHeader
      ? Number.parseInt(contentLengthHeader, 10)
      : undefined;

    // 200/206 are fine; some servers reject Range and return 200.
    const reachable = status === 200 || status === 206;
    const looksLikeVideo = looksLikeVideoContentType(contentType, url);

    if (!reachable) {
      log.warn("URL probe returned non-success status", {
        url,
        status,
        contentType,
        looksLikeVideo,
      });
      return {
        reachable: false,
        status,
        contentType,
        looksLikeVideo,
        code: "UNREACHABLE_URL",
        reason: `The URL returned HTTP ${status}.`,
      };
    }

    log.info("URL probe succeeded", {
      status,
      contentType,
      contentLength,
      looksLikeVideo,
    });

    return {
      reachable: true,
      status,
      contentType,
      contentLength,
      looksLikeVideo,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message === "URL_PROBE_TIMEOUT";

    log.error("URL probe failed", {
      url,
      error: message,
      stack: err instanceof Error ? err.stack : undefined,
    });

    return {
      reachable: false,
      looksLikeVideo: false,
      code: isTimeout ? "URL_TIMEOUT" : "UNREACHABLE_URL",
      reason: isTimeout
        ? "The URL took too long to respond."
        : `The URL could not be reached: ${message}`,
    };
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
