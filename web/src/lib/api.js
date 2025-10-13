// web/src/lib/api.js
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") || "http://localhost:8000";

async function handle(r) {
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status} ${r.statusText} — ${text}`);
  }
  return r.json();
}

export async function apiHealth() {
  const r = await fetch(`${API_BASE}/health`, { method: "GET" });
  return handle(r);
}

export async function predict(rows) {
  const r = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  return handle(r);
}
