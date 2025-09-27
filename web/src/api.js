// Reads the API base from Vercel public env var
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// rows is an array of feature objects: [{ TST_min: 420, ... }]
export async function predict(rows) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_BASE is not set in Vercel project settings.");
  }

  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}
