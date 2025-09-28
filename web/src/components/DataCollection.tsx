import React, { useState } from "react";
import { predict } from "../api";

 if it already looks like this, keep it
import { health } from "../api";


// If it had something else (like "../api.js" or a path to lib), replace it with:


// The feature keys must match what your backend's model expects (features.json)
const INITIAL = {
  TST_min: "",
  REM_total_min: "",
  REM_latency_min: "",
  REM_pct: "",
  REM_density: "",
  psqi_global: "",
  sleep_efficiency_pct: "",
  micro_arousals_count: "",
  mean_delta_pow: "",
  mean_theta_pow: "",
  mean_alpha_pow: "",
  mean_beta_pow: "",
  artifact_pct: "",
  percent_epochs_missing: "",
};

export default function DataCollection() {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setResult(null);
    setLoading(true);

    // Convert strings to numbers (empty -> 0)
    const row = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" ? 0 : Number(v)])
    );

    try {
      const data = await predict([row]);
      setResult(data);
    } catch (e) {
      setErr(e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(INITIAL);
    setResult(null);
    setErr("");
  };

  return (
    <div>
      <form onSubmit={handleSubmit}
            style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(260px, 1fr))", gap: "12px" }}>
        {Object.keys(INITIAL).map((key) => (
          <div key={key} style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor={key} style={{ fontSize: 13, marginBottom: 6, color: "#333" }}>{key}</label>
            <input
              id={key}
              type="number"
              step="any"
              name={key}
              value={form[key]}
              onChange={handleChange}
              placeholder="0"
              style={{ padding: "0.55rem 0.7rem", border: "1px solid #ccc", borderRadius: 6 }}
              required
            />
          </div>
        ))}
        <div style={{ gridColumn: "1 / -1", marginTop: 10 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.7rem 1.2rem",
              backgroundColor: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              marginRight: 10
            }}
          >
            {loading ? "Predicting..." : "Predict"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            style={{
              padding: "0.7rem 1.2rem",
              backgroundColor: "#eee",
              color: "#222",
              border: "1px solid #ccc",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {err && (
        <div style={{ marginTop: 16, background: "#ffe6e6", border: "1px solid #ffb3b3", padding: 12, borderRadius: 6 }}>
          <strong>Error:</strong> {err}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 20, background: "#f7f7f7", border: "1px solid #ddd", padding: 14, borderRadius: 6 }}>
          <h2 style={{ marginTop: 0 }}>Prediction Result</h2>
          {result.results.map((r, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div><strong>Predicted Risk:</strong> {r.pred_risk}</div>
              <div><strong>Probabilities:</strong> {r.probs.map((p) => p.toFixed(4)).join("  •  ")}</div>
            </div>
          ))}
          <div style={{ fontSize: 12, color: "#666" }}>
            <strong>Features used:</strong> {Array.isArray(result.features_used) ? result.features_used.length : "n/a"}
          </div>
        </div>
      )}
    </div>
  );
}
