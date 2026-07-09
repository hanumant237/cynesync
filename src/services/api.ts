/**
 * CineSync — API Service Layer
 *
 * Central place for backend-facing calls. Each domain (media, watch parties,
 * settings, ...) gets its own module. This file aggregates them so pages can
 * import from `@/services/api` uniformly.
 *
 * In this foundation phase the methods are placeholders that document the
 * intended contract; they will be implemented when the backend is built.
 */

import { httpClient } from "@/services/httpClient";
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
  watchParty: watchPartyApi,
  settings: settingsApi,
};

export default api;
