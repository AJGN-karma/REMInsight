// web/src/pages/index.jsx
import React, { useState } from "react";
import { API_BASE, predict } from "../api";

const initial = {
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
};

export default function Home() {
  const [features, setFeatures] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState(null);
  const [error, setError] = useState(null);

  function updateField(key, v) {
    const num = v === "" ? "" : Number(v);
    setFeatures((prev) => ({ ...prev, [key]: Number.isNaN(num) ? "" : num }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setResp(null);

    const payload = {};
    for (const [k, v] of Object.entries(features)) {
      if (v !== "" && v !== null) payload[k] = Number(v);
    }

    const required = [
      "TST_min",
      "REM_total_min",
      "REM_latency_min",
      "REM_pct",
      "REM_density",
      "psqi_global"
    ];
    for (const r of required) {
      if (!(r in payload)) {
        setError(`Missing required field: ${r}`);
        return;
      }
    }

    try {
      setLoading(true);
      const data = await predict(payload, true);
      setResp(data);
    } catch (err) {
      setError(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const Field = ({ name, label, step = "any" }) => (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <label style={{ width: 220 }}>{label}</label>
      <input
        type="number"
        step={step}
        value={features[name]}
        onChange={(e) => updateField(name, e.target.value)}
        placeholder="e.g. 420"
        style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
      />
    </div>
  );

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "start center",
        padding: 24,
        background: "#0b1220",
        color: "white"
      }}
    >
      <div style={{ width: "100%", maxWidth: 900 }}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>REMInsight</h1>
          <p style={{ opacity: 0.8, marginTop: 8 }}>
            Backend: <code>{API_BASE || "(missing NEXT_PUBLIC_API_BASE)"}</code>
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          style={{
            display: "grid",
            gap: 12,
            padding: 16,
            background: "#101a33",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}
        >
          <Field name="TST_min" label="Total Sleep Time (min)" />
          <Field name="REM_total_min" label="REM Total (min)" />
          <Field name="REM_latency_min" label="REM Latency (min)" />
          <Field name="REM_pct" label="REM % of TST" />
          <Field name="REM_density" label="REM Density (events/min)" />
          <Field name="psqi_global" label="PSQI Global" />
          <Field name="sleep_efficiency_pct" label="Sleep Efficiency (%)" />
          <Field name="micro_arousals_count" label="Micro Arousals (count)" step="1" />
          <Field name="mean_delta_pow" label="Mean Delta Power" />
          <Field name="mean_theta_pow" label="Mean Theta Power" />
          <Field name="mean_alpha_pow" label="Mean Alpha Power" />
          <Field name="mean_beta_pow" label="Mean Beta Power" />
          <Field name="artifact_pct" label="Artifact (%)" />
          <Field name="percent_epochs_missing" label="Missing Epochs (%)" />

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid #3456ff",
                background: loading ? "#223" : "#223cff",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Predicting..." : "Predict Risk"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFeatures(initial);
                setResp(null);
                setError(null);
              }}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid #999",
                background: "#1a2544",
                color: "white",
                cursor: "pointer"
              }}
            >
              Reset
            </button>
          </div>

          {error && (
            <div
              style={{
                background: "#3a1a1a",
                border: "1px solid #7a2a2a",
                borderRadius: 12,
                padding: 12,
                marginTop: 8,
                color: "#ffbdbd",
                whiteSpace: "pre-wrap"
              }}
            >
              {error}
            </div>
          )}

          {resp && (
            <div
              style={{
                background: "#12233d",
                border: "1px solid #2e4780",
                borderRadius: 12,
                padding: 12,
                marginTop: 8,
                whiteSpace: "pre-wrap"
              }}
            >
              <h3 style={{ marginTop: 0 }}>Prediction</h3>
              <pre style={{ margin: 0 }}>{JSON.stringify(resp, null, 2)}</pre>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
