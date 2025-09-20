import React, { useState } from "react";
import { predict } from "../api";

export default function Home() {
  const [features, setFeatures] = useState({
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
    percent_epochs_missing: ""
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFeatures({ ...features, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const cleaned = {};
    for (let k in features) cleaned[k] = parseFloat(features[k]) || 0;

    try {
      const res = await predict(cleaned);
      setResult(res[0]); // API returns an array
    } catch (err) {
      console.error(err);
      alert("Prediction failed. Check console.");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>REMInsight – Psychiatric Risk Prediction</h1>
      <p>Enter features to predict psychiatric risk level:</p>

      {Object.keys(features).map((k) => (
        <div key={k} style={{ marginBottom: "8px" }}>
          <label style={{ marginRight: "8px" }}>{k}</label>
          <input
            type="number"
            name={k}
            value={features[k]}
            onChange={handleChange}
            style={{ padding: "4px", width: "220px" }}
          />
        </div>
      ))}

      <button onClick={handleSubmit} style={{ padding: "8px 16px", marginTop: "12px" }}>
        Predict
      </button>

      {result && (
        <div style={{ marginTop: "20px", background: "#eee", padding: "10px" }}>
          <h2>Prediction Result</h2>
          <p>Risk: <b>{result.pred_risk}</b></p>
          <p>Probabilities: {result.probs.map((p) => p.toFixed(3)).join(", ")}</p>
        </div>
      )}
    </div>
  );
}
