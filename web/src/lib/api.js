// web/src/lib/api.js
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// Utility to handle JSON + errors cleanly
async function jsonOrThrow(res) {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const msg =
      (data && (data.detail || data.message)) ||
      text ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Health endpoint (checks backend connection)
export async function apiHealth() {
  const r = await fetch(`${API_BASE}/health`, { method: "GET" });
  return jsonOrThrow(r);
}

// Get available features from backend
export async function getFeatures() {
  const r = await fetch(`${API_BASE}/features`, { method: "GET" });
  return jsonOrThrow(r);
}

// Main prediction endpoint
export async function predict(rows) {
  // Ping /health first to warm up Render backend (cold starts)
  try { await apiHealth(); } catch {}

  try {
    const r1 = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows })
    });
    return await jsonOrThrow(r1);
  } catch (e) {
    console.warn("Prediction error, retrying once:", e.message);
    // Retry once in case of Render cold-start or network hiccup
    const r2 = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows })
    });
    return await jsonOrThrow(r2);
  }
}
