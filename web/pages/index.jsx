// web/pages/index.jsx
import React, { useEffect, useState } from "react";
import Head from "next/head";
import { apiHealth, predict } from "../lib/api";
import DataCollection from "../src/components/DataCollection";
// (and any others like PersonalInfoForm, ResultsDashboard, etc.)

// Your components
import PersonalInfoForm from "../src/components/PersonalInfoForm";
import ResultsDashboard from "../src/components/ResultsDashboard";

export default function Home() {
  const [healthOk, setHealthOk] = useState(null);
  const [step, setStep] = useState("personal"); // personal -> data -> results
  const [personalInfo, setPersonalInfo] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 1) Check backend health once
  useEffect(() => {
    (async () => {
      try {
        const h = await apiHealth();
        setHealthOk(h);
      } catch (e) {
        setHealthOk({ ok: false });
      }
    })();
  }, []);

  // Called by PersonalInfoForm when saved
  const onPersonalComplete = (data) => {
    setPersonalInfo(data);
    setStep("data");
  };

  // Called by DataCollection when user clicks Analyze
  // We will send ONE row to /predict using the subjective data.
  const onDataCollected = async (deviceOrFileResults) => {
    setBusy(true);
    setError("");

    try {
      // Minimal row mapping (subjective fields). Adjust to your model’s feature names.
      const row = {
        // Map your actual model feature names here:
        name: personalInfo?.name || "",
        age: Number(personalInfo?.age ?? 0),
        gender: personalInfo?.gender || "",
        sleep_quality: Number(personalInfo?.sleepQuality ?? 0),
        sleep_duration: Number(personalInfo?.sleepDuration ?? 0),
        sleep_issues: Array.isArray(personalInfo?.sleepIssues)
          ? personalInfo.sleepIssues.join("|")
          : "",
        medical_history: personalInfo?.medicalHistory || "",
        // You can later add processed features from deviceOrFileResults if needed
      };

      const resp = await predict([row]); // backend expects { rows: [...] }
      // Example expected response shape (per your FastAPI): { results: [{ pred_risk, probs }], features_used: [...] }
      const modelPayload = resp;

      // Combine ML results with the UI’s mocked charts/data for now:
      const merged = {
        ...(deviceOrFileResults || {}),
        model: modelPayload,
      };

      setAnalysisResults(merged);
      setStep("results");
    } catch (e) {
      setError(e.message || "Prediction failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head>
        <title>REMInsight</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="w-full bg-white border-b">
          <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">🧠 REMInsight</h1>
            <div className="text-sm">
              API:{" "}
              {healthOk ? (
                <span className="text-green-600">UP</span>
              ) : (
                <span className="text-red-600">DOWN</span>
              )}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-center gap-6 my-6">
            {["personal", "data", "results"].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={
                    "w-10 h-10 rounded-full flex items-center justify-center text-white " +
                    (step === s
                      ? "bg-blue-600"
                      : s === "personal" ||
                        (s === "data" && personalInfo) ||
                        (s === "results" && analysisResults)
                      ? "bg-green-600"
                      : "bg-gray-400")
                  }
                >
                  {i + 1}
                </div>
                <span className="text-sm capitalize">{s}</span>
                {i < 2 && <div className="w-12 h-0.5 bg-gray-300" />}
              </div>
            ))}
          </div>

          {/* Content per step */}
          {step === "personal" && (
            <PersonalInfoForm onComplete={onPersonalComplete} />
          )}

          {step === "data" && (
            <>
              <DataCollection onDataCollected={onDataCollected} />
              <div className="mt-4 text-right">
                <button
                  onClick={() => setStep("personal")}
                  className="px-4 py-2 rounded bg-gray-200"
                >
                  ← Back
                </button>
              </div>
            </>
          )}

          {step === "results" && (
            <>
              <ResultsDashboard
                results={analysisResults}
                personalInfo={personalInfo}
              />
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => setStep("data")}
                  className="px-4 py-2 rounded bg-gray-200"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    setAnalysisResults(null);
                    setStep("personal");
                  }}
                  className="px-4 py-2 rounded bg-blue-600 text-white"
                >
                  New Analysis
                </button>
              </div>
            </>
          )}

          {busy && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              Running model…
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
