// Central API configuration
// VITE_API_URL is baked at build time. Keep the production backend as the
// canonical fallback, while protecting against a frontend URL being supplied
// accidentally as VITE_API_URL on the separate Render frontend service.
const PRODUCTION_API_URL = "https://college-erp-backend-91zi.onrender.com";
const configuredUrl = (import.meta.env.VITE_API_URL || "").trim();
const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

let rawUrl = configuredUrl;

if (isLocalhost) {
  // Local development may intentionally use an empty value (Vite proxy) or
  // an explicit VITE_API_URL.
  rawUrl = configuredUrl;
} else if (!configuredUrl) {
  rawUrl = PRODUCTION_API_URL;
} else {
  // If Render/Vite was configured with the frontend's own origin (for
  // example https://2p8.onrender.com), it is not the API service. Fall back
  // to the known live backend instead of sending every ERP request to the UI.
  try {
    const configured = new URL(configuredUrl, window.location.origin);
    const currentOrigin = window.location.origin;
    rawUrl = configured.origin === currentOrigin ? PRODUCTION_API_URL : configuredUrl;
  } catch {
    rawUrl = PRODUCTION_API_URL;
  }
}

// Strip trailing /api or /api/ to avoid double /api/api/... in requests.
export const API_BASE_URL = rawUrl.replace(/\/api\/?$/, "");
