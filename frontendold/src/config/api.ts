// Central API configuration
// VITE_API_URL is baked at build time. Fallback to production backend URL.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname !== "localhost"
    ? "https://college-erp-backend-91zi.onrender.com"
    : "");
