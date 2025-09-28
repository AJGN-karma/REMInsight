// web/src/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
if (!API_BASE) {
  throw new Error("NEXT_PUBLIC_API_BASE is not set");
}

export async function health() {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health failed: ${res.status}`);
  return res.json();
}

export async function predict(rows: Array<Record<string, any>>) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Predict failed: ${res.status} ${text}`);
  }
  return res.json();
}
