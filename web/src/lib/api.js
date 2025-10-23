// web/src/lib/api.js
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://reminsight.onrender.com";

async function j(res) {
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${t}`);
  }
  return res.json();
}

export async function apiHealth() {
  // /health -> { status: "ok", features: 24 }
  const r = await fetch(`${API_BASE}/health`, { method: "GET" });
  return j(r);
}

export async function getFeatures() {
  // /features -> { features: [...] }
  const r = await fetch(`${API_BASE}/features`, { method: "GET" });
  return j(r);
}

export async function predict(rows) {
  // body must be: { rows: [...] }
  const r = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  return j(r);
}
