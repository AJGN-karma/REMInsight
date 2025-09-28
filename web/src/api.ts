// web/src/api.ts
// Uses Vercel env: NEXT_PUBLIC_API_BASE
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

if (!API_BASE) {
  // This makes failures obvious if env var is missing on Vercel
  // Set this in Vercel Project → Settings → Environment Variables
  throw new Error("NEXT_PUBLIC_API_BASE is not set");
}

/**
 * POST rows to FastAPI /predict
 * Expects: rows: Array<Record<string, any>>
 * Returns: { results: [...], features_used: [...] }
 */
export async function predict(rows: Array<Record<string, any>>) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Our FastAPI endpoint expects { rows: [...] }
    body: JSON.stringify({ rows }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Predict failed: ${res.status} ${text}`);
  }
  return res.json();
}

/** Optional simple health check */
export async function health() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
