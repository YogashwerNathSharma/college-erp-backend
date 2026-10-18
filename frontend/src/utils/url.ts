import { API_BASE_URL } from "../config/api";

/**
 * Convert a relative file path (from backend) to a full URL.
 * Works on both localhost (API_BASE_URL = "") and production.
 *
 * Examples:
 *   "/uploads/logo.png" → "https://backend.onrender.com/uploads/logo.png"
 *   "logo.png"          → "https://backend.onrender.com/uploads/logo.png"
 *   "https://..."       → "https://..." (unchanged)
 *   null/undefined      → undefined
 */
export function getFullUrl(path: string): string;
export function getFullUrl(path: string | null | undefined): string | undefined;
export function getFullUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/uploads/${path}`;
}
