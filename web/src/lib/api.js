const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function apiHealth() {
  const r = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!r.ok) throw new Error("health check failed");
  return r.json(); // {status:"ok", features:<number>} on your backend
}

export async function predict(rows) {
  const r = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows })
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`predict failed (${r.status}): ${text}`);
  }
  return r.json(); // { results: [...], features_used: [...] }
}
