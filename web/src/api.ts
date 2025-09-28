// web/src/api.ts
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE as string) ||
  (typeof window !== "undefined" ? window.location.origin : "");

// Optional health check (used for debugging connectivity)
export async function health() {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health failed: ${res.status}`);
  return res.json();
}

// Predict endpoint – post your payload to the FastAPI server
export async function predict(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Predict failed: ${res.status} ${text}`);
  }
  return res.json();
}
