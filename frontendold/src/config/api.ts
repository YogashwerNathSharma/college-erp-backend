// Central API configuration
// VITE_API_URL is baked at build time. Fallback to production backend URL.
const rawUrl =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname !== "localhost"
    ? "https://college-erp-backend-91zi.onrender.com"
    : "");

// Strip trailing /api or /api/ to avoid double /api/api/... in requests
export const API_BASE_URL = rawUrl.replace(/\/api\/?$/, "");
