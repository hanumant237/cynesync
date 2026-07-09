/**
 * CineSync — HTTP Client
 *
 * Thin wrapper around axios providing a single configured instance for all
 * backend communication. Future phases can attach interceptors for auth
 * tokens, error normalization, and request retries here.
 */

import axios, { type AxiosInstance } from "axios";
import { API_BASE_URL } from "@/utils/constants";

/** Shared axios instance used by every service module. */
export const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// NOTE: Interceptors (auth, logging, error mapping) will be wired here in a
// future phase. Keeping the hook points explicit so the structure is obvious.
