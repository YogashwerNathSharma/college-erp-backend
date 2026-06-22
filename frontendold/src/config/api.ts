// Central API configuration
// VITE_API_URL is baked at build time. Fallback to production backend URL.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production"
    ? "https://college-erp-backend-91zi.onrender.com"
    : "");
