// web/src/api.ts
// Use Next.js public env variables from Vercel (NOT import.meta.*)

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

// ---- API helpers ----
export async function predict(
  features: Record<string, any>,
  explain = true,
  token?: string
) {
  if (!API_BASE) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE is not set. Add it in Vercel → Project → Settings → Environment Variables."
    );
  }

  const res = await fetch(`${API_BASE}/predict?explain=${explain}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(features),
    // Next.js on Vercel: no credentials by default
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${txt || res.statusText}`);
  }

  return res.json();
}
