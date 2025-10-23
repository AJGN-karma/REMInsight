// web/pages/index.jsx
import React, { useEffect, useState } from "react";
import Head from "next/head";
import { apiHealth, predict } from "../src/lib/api";
import DataCollection from "../src/components/DataCollection";
import PersonalInfoForm from "../src/components/PersonalInfoForm";
import ResultsDashboard from "../src/components/ResultsDashboard";

export default function Home() {
  const [health, setHealth] = useState(null);
  const [step, setStep] = useState("personal"); // personal -> data -> results
  const [personalInfo, setPersonalInfo] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const h = await apiHealth();
        setHealth(h);
      } catch {
        setHealth({ ok: false });
      }
    })();
  }, []);

  const onPersonalComplete = (data) => {
    setPersonalInfo(data);
    setStep("data");
  };

  // Called by <DataCollection /> with normalized rows
  const onDataCollected = async (normalizedRows) => {
    setBusy(true);
    setErr("");
    try {
      const resp = await predict(normalizedRows); // {results:[{pred_risk, probs:[]}], features_used:[...]}
      setAnalysisResults(resp);
      setStep("results");
    } catch (e) {
      setErr(e.message || "Prediction failed");
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const bar = {
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 10
  };

  return (
    <>
      <Head>
        <title>REMInsight</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      <div style={bar}>
        <div
          style={{
            maxWidth: 1024,
            margin: "0 auto",
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>🧠 REMInsight</div>
          <div style={{ fontSize: 14 }}>
            API:{" "}
            {health?.status === "ok" || health?.ok ? (
              <span style={{ color: "#16a34a", fontWeight: 600 }}>UP</span>
            ) : (
              <span style={{ color: "#dc2626", fontWeight: 600 }}>DOWN</span>
            )}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 768, margin: "0 auto", padding: 16 }}>
        {/* Stepper */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center", margin: "16px 0" }}>
          {["personal", "data", "results"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  background:
                    step === s
                      ? "#2563eb"
                      : s === "personal" ||
                        (s === "data" && personalInfo) ||
                        (s === "results" && analysisResults)
                      ? "#16a34a"
                      : "#9ca3af",
                  fontWeight: 700
                }}
              >
                {i + 1}
              </div>
              <span style={{ textTransform: "capitalize", fontSize: 14 }}>{s}</span>
              {i < 2 && <div style={{ width: 48, height: 2, background: "#e5e7eb" }} />}
            </div>
          ))}
        </div>

        {/* Content */}
        {step === "personal" && <PersonalInfoForm onComplete={onPersonalComplete} />}

        {step === "data" && (
          <>
            <DataCollection onDataCollected={onDataCollected} />
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button
                onClick={() => setStep("personal")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer"
                }}
              >
                ← Back
              </button>
            </div>
          </>
        )}

        {step === "results" && (
          <>
            <ResultsDashboard results={analysisResults} personalInfo={personalInfo} />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => setStep("data")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer"
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  setAnalysisResults(null);
                  setStep("personal");
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                New Analysis
              </button>
            </div>
          </>
        )}

        {busy && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 8
            }}
          >
            Running model…
          </div>
        )}
        {err && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#b91c1c"
            }}
          >
            {err}
          </div>
        )}
      </main>
    </>
  );
}
