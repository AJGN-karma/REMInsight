import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handlePredict() {
    setLoading(true);
    setResult(null);

    const rows = [
      {
        TST_min: 420,
        REM_total_min: 85,
        REM_latency_min: 90,
        REM_pct: 20.2,
        REM_density: 2.1,
        SE_pct: 89.5,
        SOL_min: 18,
        WASO_min: 35,
        Awakenings_count: 6,
        Arousal_index: 12.4,
        StageN1_pct: 6.1,
        StageN2_pct: 49.0,
        StageN3_pct: 24.7,
        AHI: 1.2,
        ODI: 0.8,
        Min_SpO2_pct: 92.0,
        Mean_SpO2_pct: 96.1,
        PLMI: 0.4,
        HeartRate_mean: 64.2,
        HeartRate_min: 52,
        HeartRate_max: 88,
        Age: 28,
        BMI: 23.4,
        Sex_M: 1
      }
    ];

    const base = process.env.NEXT_PUBLIC_API_BASE; // set in Vercel
    const res = await fetch(`${base}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows })
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>REMInsight</h1>
      <p>
        Backend: <code>{process.env.NEXT_PUBLIC_API_BASE}</code>
      </p>
      <button onClick={handlePredict} disabled={loading} style={{ padding: "0.5rem 1rem" }}>
        {loading ? "Predicting…" : "Run Prediction"}
      </button>

      {result && (
        <pre style={{ marginTop: "1rem", background: "#f3f3f3", padding: "1rem", borderRadius: 8 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
