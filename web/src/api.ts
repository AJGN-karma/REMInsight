// web/src/api.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string;

type Row = Record<string, any>;

export async function predict(rows: Row[]) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API error ${res.status}: ${txt}`);
  }
  return res.json(); // { results: [{pred_risk, probs:[...]}], features_used: [...] }
}

export async function health() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
