const BASE = process.env.NEXT_PUBLIC_API_BASE; // set in Vercel

export async function pingHealth() {
  const res = await fetch(`${BASE}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health failed: ${res.status}`);
  return res.text();
}

type PredictRow = {
  TST_min: number;
  REM_total_min: number;
  REM_latency_min: number;
  REM_pct: number;
  REM_density: number;
  psqi_global: number;
  sleep_efficiency_pct: number;
  micro_arousals_count: number;
  mean_delta_pow: number;
  mean_theta_pow: number;
  mean_alpha_pow: number;
  mean_beta_pow: number;
  artifact_pct: number;
  percent_epochs_missing: number;
};

export async function predictOne(row: PredictRow) {
  const res = await fetch(`${BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows: [row] })
  });
  if (!res.ok) throw new Error(`Predict failed: ${res.status}`);
  return res.json();
}
