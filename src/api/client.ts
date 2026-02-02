const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

let getTokenFn: (() => string | null) | null = null;

export function setTokenGetter(fn: () => string | null) {
  getTokenFn = fn;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getTokenFn?.();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.message || payload?.error || `HTTP ${res.status}`);
  }
  return res.json();
}
