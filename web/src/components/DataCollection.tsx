import React, { useState } from "react";
import { predict } from "../api";

export default function DataCollection() {
  const [form, setForm] = useState({
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
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rows = [Object.fromEntries(Object.entries(form).map(([k, v]) => [k, parseFloat(v) || 0]))];
    const res = await predict(rows);
    setResult(res);
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <form onSubmit={handleSubmit}>
        {Object.keys(form).map((key) => (
          <div key={key} style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem" }}>
              {key}
            </label>
            <input
              type="number"
              name={key}
              value={form[key]}
              onChange={handleChange}
              style={{ padding: "0.5rem", width: "300px" }}
              required
            />
          </div>
        ))}
        <button
          type="submit"
          style={{
            padding: "0.7rem 1.2rem",
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Predict
        </button>
      </form>

      {result && (
        <div style={{ marginTop: "2rem", background: "#f3f3f3", padding: "1rem" }}>
          <h2>Prediction Result</h2>
          {result.results.map((r, i) => (
            <div key={i}>
              <p>Predicted Risk: {r.pred_risk}</p>
              <p>Probabilities: {r.probs.join(", ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
