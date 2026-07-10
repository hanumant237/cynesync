/**
 * CineSync — Stream Service
 *
 * Frontend service that talks to the backend streaming engine directly. Exposes:
 *  - prepareStream(url): POST /stream → StreamSession
 *  - buildPlaybackUrl(session): resolve the URL the player should load
 *  - mapStreamError(err): classify axios/backend errors into a friendly UI error
 */

import axios, { type AxiosError } from "axios";
import { BACKEND_URL } from "@/utils/constants";
import type {
  StreamError,
  StreamErrorBody,
  StreamSession,
} from "@/types/stream";

/**
 * POST /api/stream — ask the backend to inspect a media URL and prepare it for
 * playback. Returns a StreamSession describing how to play the source.
 *
 * The request goes directly to the backend server.
 * A longer timeout is used because FFprobe inspection + HLS startup can take
 * several seconds, especially for remote or large sources.
 *
 * On error, axios throws an AxiosError whose `response.data` contains the
 * backend's structured ErrorBody ({code, message, details}). The caller
 * should use `mapStreamError` to classify it into a friendly UI error.
 */
export async function prepareStream(url: string): Promise<StreamSession> {
  // Connect directly to the backend server
  const endpoint = `${BACKEND_URL}/api/stream`;
  const { data } = await axios.post<StreamSession>(endpoint, { url }, {
    timeout: 90_000,
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

/**
 * Resolve the playback URL the VideoPlayer should load for a given session.
 *  - direct strategy: use the original source URL (the browser plays it as-is)
 *  - hls strategy:    use the backend's playlist URL directly
 */
export function buildPlaybackUrl(session: StreamSession): string {
  if (session.strategy === "direct" && session.directUrl) {
    return session.directUrl;
  }
  if (session.strategy === "hls" && session.hlsPlaylistUrl) {
    // Convert relative HLS URL to absolute URL pointing to backend
    if (session.hlsPlaylistUrl.startsWith('/')) {
      return `${BACKEND_URL}${session.hlsPlaylistUrl}`;
    }
    return session.hlsPlaylistUrl;
  }
  // Fallback: should not happen with a well-formed session.
  return session.sourceUrl;
}

/**
 * Classify any error (axios network/timeout, backend ErrorBody, or unknown)
 * into a friendly `StreamError` for the UI. Determines whether retrying might
 * help so the error card can show/hide the retry button appropriately.
 *
 * Preserves the backend's actual error message and code whenever a response
 * was received — never masks a backend error with a generic "unreachable"
 * message.
 */
export function mapStreamError(err: unknown): StreamError {
  const axiosErr = err as AxiosError<StreamErrorBody>;

  // Axios error with a backend response body — the backend DID respond,
  // possibly with an error status (400, 415, 502, 504, 500, etc.).
  // Surface the backend's structured error code + message to the user.
  if (axiosErr.response) {
    const status = axiosErr.response.status;
    const rawData: unknown = axiosErr.response.data;

    // Handle the case where the response body is a string (e.g. HTML from a proxy)
    // rather than the expected JSON ErrorBody.
    const body: StreamErrorBody | undefined =
      typeof rawData === "object" && rawData !== null
        ? (rawData as StreamErrorBody)
        : undefined;

    const code = body?.code ?? "BACKEND_ERROR";
    let message: string;
    if (body?.message) {
      message = body.message;
    } else if (typeof rawData === "string" && rawData.length > 0) {
      message = rawData;
    } else {
      message = `The streaming service returned an error (HTTP ${status}).`;
    }

    return {
      code,
      message,
      retryable: isRetryableCode(code),
    };
  }

  // Axios request made but no response — server offline, network failure,
  // or CORS blocking the response.
  if (axiosErr.request) {
    const isTimeout =
      axiosErr.code === "ECONNABORTED" ||
      /timeout/i.test(axiosErr.message ?? "");
    return {
      code: isTimeout ? "REQUEST_TIMEOUT" : "SERVER_UNREACHABLE",
      message: isTimeout
        ? "The request timed out. The server may be busy or the media too large."
        : "Can't reach the streaming server. Please check your backend connection.",
      retryable: true,
    };
  }

  // Unknown error.
  return {
    code: "UNKNOWN_ERROR",
    message: err instanceof Error
      ? err.message
      : "An unexpected error occurred while preparing the stream.",
    retryable: false,
  };
}

/**
 * Whether a given error code is worth retrying. Non-retryable errors indicate
 * a fundamental problem (unsupported format, invalid URL) that won't be fixed
 * by trying again.
 */
function isRetryableCode(code: string): boolean {
  switch (code) {
    case "INVALID_URL":
    case "UNSUPPORTED_FORMAT":
    case "FFPROBE_MISSING":
      return false;
    default:
      return true;
  }
}
