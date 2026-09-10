import { API_BASE_URL } from "../config/api";

/**
 * Convert a relative file/API path to a full URL.
 * Works on both localhost (API_BASE_URL = "") and production.
 */
export function getFullUrl(path: string): string;
export function getFullUrl(path: string | null | undefined): string | undefined;
export function getFullUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;

  // Student Management loads the roster client-side for instant local search.
  // Never let the list request become an accidentally huge 2,000-row payload;
  // keep it bounded to the largest page size supported by the UI while still
  // bypassing stale intermediary caches.
  if (path === "/api/students" || path.startsWith("/api/students?")) {
    const url = new URL(path, window.location.origin);
    const requestedLimit = Number(url.searchParams.get("limit") || "0");
    if (requestedLimit > 1000) url.searchParams.set("limit", "1000");
    url.searchParams.set("_ts", Date.now().toString());
    return `${API_BASE_URL}${url.pathname}${url.search}`;
  }

  if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/uploads/${path}`;
}
