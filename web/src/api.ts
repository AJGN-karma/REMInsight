// web/src/api.ts

// Read API base from Next.js runtime env (set in Vercel as NEXT_PUBLIC_API_BASE)
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

if (!API_BASE) {
  throw new Error("NEXT_PUBLIC_API_BASE is not set. Add it in Vercel → Project → Settings → Environment Variables.");
}

export async function predict(
  features: Record<string, any>,
  explain = true,
  token?: string
) {
  const res = await fetch(`${API_BASE}/predict?explain=${String(explain)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify([features]),
    // ensure no caching of API responses
    cache: "no-store"
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Predict failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function health() {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}
