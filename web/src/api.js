// web/src/api.js
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export async function predict(features, explain = true, token) {
  if (!API_BASE) throw new Error("API base not configured");

  const res = await fetch(`${API_BASE}/predict?explain=${String(explain)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(features)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}
