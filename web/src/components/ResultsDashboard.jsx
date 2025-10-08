import React, { useState } from "react";

export default function ResultsDashboard({ results, personalInfo }) {
  const [tab, setTab] = useState("overview");

  const card = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
  };

  if (!results) {
    return (
      <div style={card}>
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🧠</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>No results yet</div>
          <div style={{ color: "#6b7280" }}>Run an analysis to see results here.</div>
        </div>
      </div>
    );
  }

  // model returns: { results: [{pred_risk, probs:[..]}], features_used:[..] }
  const avgProb =
    results.results && results.results.length
      ? results.results[0].probs.map((_, i) =>
          (
            results.results
              .map((r) => r.probs[i])
              .reduce((a, b) => a + b, 0) / results.results.length
          ).toFixed(3)
        )
      : [];

  const riskMap = ["Low", "Medium", "High"];
  const predCounts = [0, 0, 0];
  (results.results || []).forEach((r) => {
    predCounts[r.pred_risk] = (predCounts[r.pred_risk] || 0) + 1;
  });

  const total = (results.results || []).length || 1;
  const predPerc = predCounts.map((n) => ((n / total) * 100).toFixed(1));

  return (
    <div style={card}>
      <h2 style={{ margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700 }}>
        📈 Prediction Summary
      </h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[
          ["overview", "📊 Overview"],
          ["probs", "🎯 Class Probabilities"],
          ["personal", "👤 Personal Info"]
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: tab === key ? "#fff" : "#f3f4f6",
              cursor: "pointer"
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))"
            }}
          >
            {riskMap.map((r, i) => (
              <Stat
                key={r}
                title={`${r} Risk`}
                value={`${predPerc[i]}%`}
                color={i === 0 ? "#10b981" : i === 1 ? "#f59e0b" : "#ef4444"}
              />
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              background: "#f9fafb",
              borderRadius: 12,
              padding: 16
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Model Confidence
            </div>
            <div style={{ fontSize: 14, color: "#374151" }}>
              Predicted psychiatric risk category is{" "}
              <b>
                {
                  riskMap[
                    results.results?.[0]?.pred_risk ?? 0
                  ]
                }
              </b>{" "}
              based on analyzed REM + PSQI parameters.
            </div>
          </div>
        </>
      )}

      {/* Probabilities */}
      {tab === "probs" && (
        <div
          style={{
            background: "#f9fafb",
            borderRadius: 12,
            padding: 16
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Average Class Probabilities
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14
            }}
          >
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: "8px 4px" }}>Class</th>
                <th style={{ padding: "8px 4px" }}>Probability</th>
              </tr>
            </thead>
            <tbody>
              {avgProb.map((p, i) => (
                <tr key={i}>
                  <td style={{ padding: "6px 4px" }}>{riskMap[i] || i}</td>
                  <td style={{ padding: "6px 4px" }}>{p}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 12, color: "#6b7280", fontSize: 12 }}>
            Probabilities are normalized softmax outputs from the trained XGBoost model.
          </div>
        </div>
      )}

      {/* Personal Info */}
      {tab === "personal" && personalInfo && (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <InfoCard title="Basic Information">
            <Row k="Name" v={personalInfo.name} />
            <Row k="Age" v={personalInfo.age} />
            <Row k="Gender" v={personalInfo.gender} />
          </InfoCard>
          <InfoCard title="Sleep Patterns">
            <Row k="Sleep Quality" v={`${personalInfo.sleepQuality}/10`} />
            <Row k="Sleep Duration" v={`${personalInfo.sleepDuration}h`} />
          </InfoCard>
          {!!(personalInfo.sleepIssues || []).length && (
            <InfoCard title="Reported Sleep Issues">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {personalInfo.sleepIssues.map((s) => (
                  <span
                    key={s}
                    style={{
                      background: "#fef3c7",
                      padding: "4px 8px",
                      borderRadius: 9999
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </InfoCard>
          )}
          {personalInfo.medicalHistory && (
            <InfoCard title="Medical History">
              <div style={{ whiteSpace: "pre-wrap" }}>
                {personalInfo.medicalHistory}
              </div>
            </InfoCard>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ title, value, color }) {
  return (
    <div
      style={{
        background: "#f3f4f6",
        borderRadius: 12,
        padding: 12
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#374151" }}>{title}</div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div style={{ background: "#f9fafb", borderRadius: 12, padding: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <div style={{ color: "#6b7280" }}>{k}:</div>
      <div style={{ fontWeight: 600 }}>{v}</div>
    </div>
  );
}
