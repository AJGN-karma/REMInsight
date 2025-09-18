import { useState } from "react";
import { pingHealth, predictOne } from "../lib/api";

export default function Home() {
  const [health, setHealth] = useState<string>("");
  const [result, setResult] = useState<string>("");

  const sample = {
    TST_min: 420,
    REM_total_min: 95,
    REM_latency_min: 80,
    REM_pct: 22.6,
    REM_density: 0.9,
    psqi_global: 7,
    sleep_efficiency_pct: 90,
    micro_arousals_count: 12,
    mean_delta_pow: 0.8,
    mean_theta_pow: 1.2,
    mean_alpha_pow: 0.6,
    mean_beta_pow: 0.4,
    artifact_pct: 2.0,
    percent_epochs_missing: 0.0
  };

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>🧠 REMInsight</h1>
      <p>Frontend ↔ Backend smoke test</p>

      <section style={{ marginTop: 24 }}>
        <button onClick={async () => {
          try {
            const txt = await pingHealth();
            setHealth(txt);
          } catch (e:any) {
            setHealth(e.message);
          }
        }}>
          Check API /health
        </button>
        <pre style={{ background:"#f6f8fa", padding:12 }}>{health}</pre>
      </section>

      <section style={{ marginTop: 24 }}>
        <button onClick={async () => {
          setResult("Loading...");
          try {
            const data = await predictOne(sample);
            setResult(JSON.stringify(data, null, 2));
          } catch (e:any) {
            setResult(e.message);
          }
        }}>
          Predict (sample row)
        </button>
        <pre style={{ background:"#f6f8fa", padding:12, whiteSpace:"pre-wrap" }}>{result}</pre>
      </section>
    </main>
  );
}
