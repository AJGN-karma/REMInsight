export const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export async function predict(rows) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  return res.json();
}
