export const API_BASE = import.meta.env.VITE_API_BASE;

export async function predict(features: Record<string, any>, explain = true, token?: string) {
  const res = await fetch(`${API_BASE}/predict?explain=${explain}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: "Bearer dev-secret" }),
    },
    body: JSON.stringify({ features }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
