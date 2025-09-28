// web/lib/api.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_URL as string;

function must<T>(v: T | undefined | null, name: string): T {
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const base = must(API_BASE, "NEXT_PUBLIC_API_URL");

export async function apiHealth(): Promise<any> {
  const res = await fetch(`${base}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health ${res.status}`);
  return res.json();
}

export async function predict(rows: Array<Record<string, any>>): Promise<any> {
  const res = await fetch(`${base}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Predict ${res.status} ${txt}`);
  }
  return res.json();
}
