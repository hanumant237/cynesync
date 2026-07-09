/**
 * CineSync — API Service Layer
 *
 * Central place for backend-facing calls. Each domain (media, stream, watch
 * parties, settings, ...) gets its own module. This file aggregates them so
 * pages can import from `@/services/api` uniformly.
 */

import { httpClient } from "@/services/httpClient";
import { prepareStream, buildPlaybackUrl, mapStreamError } from "@/services/stream";
import type { MediaItem } from "@/types/media";

/** Media-related API calls. */
export const mediaApi = {
  /** List all media items the user can access. */
  async list(): Promise<MediaItem[]> {
    const { data } = await httpClient.get<MediaItem[]>("/media");
    return data;
  },
  /** Fetch a single media item by id. */
  async getById(id: string): Promise<MediaItem> {
    const { data } = await httpClient.get<MediaItem>(`/media/${id}`);
    return data;
  },
};

/** Stream-related API calls (connected to the backend streaming engine). */
export const streamApi = {
  prepareStream,
  buildPlaybackUrl,
  mapStreamError,
};

/** Watch-party-related API calls (placeholder for a future phase). */
export const watchPartyApi = {
  async list() {
    const { data } = await httpClient.get("/watch-parties");
    return data;
  },
};

/** User settings API calls (placeholder for a future phase). */
export const settingsApi = {
  async get() {
    const { data } = await httpClient.get("/settings");
    return data;
  },
};

/** Aggregated API surface for convenient `import { mediaApi } from "@/services/api"`. */
export const api = {
  media: mediaApi,
  stream: streamApi,
  watchParty: watchPartyApi,
  settings: settingsApi,
};

export default api;
