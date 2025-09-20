// web/src/api.ts
// Use Next.js public env variables from Vercel (NOT import.meta.*)
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE as string) || "";


if (!API_BASE) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE is not set. In Vercel → Project → Settings → Environment Variables, add NEXT_PUBLIC_API_BASE=https://reminsight.onrender.com"
  );
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
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify([features]),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Predict failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function health() {
  const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}
