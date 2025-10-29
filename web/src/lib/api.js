export const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

async function jsonOrThrow(res) {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function apiHealth() {
  const r = await fetch(`${API_BASE}/health`, { method: "GET" });
  return jsonOrThrow(r);
}

export async function getFeatures() {
  const r = await fetch(`${API_BASE}/features`);
  return jsonOrThrow(r);
}

export async function validateRows(rows) {
  const r = await fetch(`${API_BASE}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows })
  });
  return jsonOrThrow(r);
}

export async function predict(rows) {
  // warmup (helps on free cold starts)
  try { await apiHealth(); } catch {}
  try {
    const r1 = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows })
    });
    return await jsonOrThrow(r1);
  } catch (e) {
    // single retry
    const r2 = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows })
    });
    return await jsonOrThrow(r2);
  }
}

export async function getMetrics() {
  const r = await fetch(`${API_BASE}/metrics`);
  return jsonOrThrow(r);
}
