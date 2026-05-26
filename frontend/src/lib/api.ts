export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`http://localhost:5000/api${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) throw new Error("API error");

  return res.json();
}

export function objectUrl(path: string) {
  return `http://localhost:5000/${path}`;
}