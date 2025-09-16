import { useEffect, useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const API = process.env.NEXT_PUBLIC_API_BASE; // set in Vercel

  const sampleRow = {
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
  };

  async function callApi() {
    try {
      setLoading(true);
      setResult(null);
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "accept": "application/json" },
        body: JSON.stringify({ rows: [sampleRow] })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", fontFamily: "ui-sans-serif, system-ui" }}>
      <h1>REMInsight – Demo</h1>
      <p>
        Backend health:{" "}
        <a href={`${API}/health`} target="_blank" rel="noreferrer">
          {API}/health
        </a>
      </p>

      <button
        onClick={callApi}
        disabled={loading}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          border: "1px solid #ccc",
          cursor: "pointer"
        }}
      >
        {loading ? "Predicting..." : "Run Sample Prediction"}
      </button>

      <pre style={{ background: "#111", color: "#0f0", padding: 16, borderRadius: 10, marginTop: 20, overflowX: "auto" }}>
        {result ? JSON.stringify(result, null, 2) : "Click the button to call /predict"}
      </pre>
    </main>
  );
}
