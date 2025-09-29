const API_BASE =
  (typeof window !== "undefined" && window.__API_BASE__) ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "";

export async function apiHealth() {
  const url = `${API_BASE}/health`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json(); // { ok: True } or { status: "ok" ... }
}

export async function predict(rows) {
  const url = `${API_BASE}/predict`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Predict failed (${res.status}): ${text}`);
  }
  return res.json(); // { results: [...], features_used: [...] }
}
