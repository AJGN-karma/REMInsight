// web/src/lib/api.js
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://reminsight.onrender.com";

export async function apiHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health failed: ${res.status}`);
  return res.json();
}

export async function predict(rows) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Predict failed: ${res.status} ${text}`);
  }
  return res.json();
}
