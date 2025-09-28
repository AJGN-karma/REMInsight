export async function apiHealth() {
  const res = await fetch(process.env.VITE_API_BASE + "/health");
  return res.json();
}

export async function predict(rows) {
  const res = await fetch(process.env.VITE_API_BASE + "/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  return res.json();
}
