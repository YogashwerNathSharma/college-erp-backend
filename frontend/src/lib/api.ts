// ✅ Works on localhost AND production automatically
const BASE = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD
    ? "https://college-erp-backend-91zi.onrender.com"
    : "http://localhost:5000");

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE}/api${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) throw new Error("API error");

  return res.json();
}

export function objectUrl(path: string) {
  return `${BASE}/${path}`;
}
