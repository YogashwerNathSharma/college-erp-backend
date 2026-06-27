//////////////////////////////////////////////////////
// 🌐 API CONFIGURATION
//////////////////////////////////////////////////////

const rawUrl =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname !== "localhost"
    ? "https://college-erp-backend-91zi.onrender.com"
    : "");

export const API_BASE_URL = rawUrl.replace(/\/api\/?$/, "");
export const API_URL = `${API_BASE_URL}/api`;
