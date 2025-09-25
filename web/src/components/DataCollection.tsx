import React, { useState } from "react";
import { predict } from "../api";

export default function DataCollection() {
  const [formData, setFormData] = useState({
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
    percent_epochs_missing: 0.0,
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await predict(formData);
      setResult(res);
    } catch (err) {
      console.error(err);
      alert("Prediction failed");
    }
  };

  return (
    <div>
      <h2>Enter Sleep Features</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(formData).map((key) => (
          <div key={key}>
            <label>{key}:</label>
            <input
              type="number"
              step="any"
              name={key}
              value={formData[key]}
              onChange={handleChange}
            />
          </div>
        ))}
        <button type="submit">Predict</button>
      </form>

      {result && (
        <div>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
