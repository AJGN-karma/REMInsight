// web/pages/index.jsx
import React, { useEffect, useState } from "react";
import Head from "next/head";

import { apiHealth, getFeatures, predict } from "../src/lib/api";
import {
  auth,
  ensureAnonAuth,
  registerOrLogin,
  upsertUserProfile,
  generateAnalysisId,
  savePredictionRecordUpsert,
} from "../src/lib/firebase";

export default function Home() {
  const [health, setHealth] = useState(null);
  const [step, setStep] = useState("personal");
  const [personalInfo, setPersonalInfo] = useState(null);
  const [userId, setUserId] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);
  const [savedOnce, setSavedOnce] = useState(false);
  const [uploadedRows, setUploadedRows] = useState(null);
  const [apiFeatures, setApiFeatures] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [h, f] = await Promise.all([apiHealth(), getFeatures()]);
        setHealth(h);
        setApiFeatures(f.features || []);
      } catch {
        setHealth({ ok: false });
      }
    })();
  }, []);

  async function ensureAuthMatchesUser(expectedUid) {
    // If not signed in, sign in anonymously and sync userId
    if (!auth.currentUser) {
      const u = await ensureAnonAuth();
      setUserId(u.uid);
      if (expectedUid && u.uid !== expectedUid) {
        throw new Error("Session user mismatch. Please restart analysis.");
      }
      return u.uid;
    }
    // If signed in as someone else, block (rules would deny anyway)
    if (expectedUid && auth.currentUser.uid !== expectedUid) {
      throw new Error("Signed-in user differs from patient ID. Sign out and try again.");
    }
    return auth.currentUser.uid;
  }

  const onPersonalComplete = async (data) => {
    try {
      setErr("");
      setBusy(true);
      setPersonalInfo(data);

      if (data.email && data.password) {
        const user = await registerOrLogin(data.email, data.password);
        setUserId(user.uid);
        await upsertUserProfile(user.uid, {
          name: data.name || "",
          age: data.age ?? null,
          gender: data.gender || "",
        });
      } else {
        const user = await ensureAnonAuth();
        setUserId(user.uid);
        await upsertUserProfile(user.uid, {
          name: data.name || "",
          age: data.age ?? null,
          gender: data.gender || "",
        });
      }

      setAnalysisId(null);
      setSavedOnce(false);
      setStep("data");
    } catch (e) {
      setErr(e.message || "Failed to initialize user.");
    } finally {
      setBusy(false);
    }
  };

  const onDataCollected = async (rows) => {
    setErr("");
    setBusy(true);
    try {
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("No rows were uploaded.");
      }
      if (!userId) {
        const u = await ensureAnonAuth();
        setUserId(u.uid);
      }

      setUploadedRows(rows);
      const modelResp = await predict(rows);
      setAnalysisResults(modelResp);
      setStep("results");

      const aid = analysisId || generateAnalysisId();
      setAnalysisId(aid);

      // Ensure auth user matches this patient id before writing
      await ensureAuthMatchesUser(userId);

      const clientMeta = { ua: navigator.userAgent, url: window.location.href, ts: Date.now() };
      const res = await savePredictionRecordUpsert(userId, aid, {
        personalInfo: personalInfo || null,
        rows,
        apiResponse: modelResp,
        clientMeta,
      });
      if (!res.ok) {
        console.warn("Firestore save warning:", res.error);
      } else {
        setSavedOnce(true);
      }
    } catch (e) {
      setErr(e.message || "Prediction failed");
    } finally {
      setBusy(false);
    }
  };

  function manualSave() {
    if (!userId) return alert("User not initialized");
    if (!analysisResults || !uploadedRows) return alert("Nothing to save");
    if (savedOnce) {
      alert("Already saved for this analysis session.");
      return;
    }
    (async () => {
      try {
        await ensureAuthMatchesUser(userId);
        const clientMeta = { ua: navigator.userAgent, url: window.location.href, ts: Date.now() };
        const aid = analysisId || generateAnalysisId();
        setAnalysisId(aid);
        const r = await savePredictionRecordUpsert(userId, aid, {
          personalInfo: personalInfo || null,
          rows: uploadedRows || [],
          apiResponse: analysisResults || null,
          clientMeta,
        });
        if (!r.ok) alert("Save failed: " + r.error);
        else {
          alert("Saved.");
          setSavedOnce(true);
        }
      } catch (e) {
        alert(e.message || "Save blocked.");
      }
    })();
  }

  const bar = { background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 10 };

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
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>🧠 REMInsight</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/history" style={{ textDecoration: "none", color: "#2563eb" }}>
              History
            </a>
            <a href="/admin" style={{ textDecoration: "none", color: "#2563eb" }}>
              Admin
            </a>
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
      </div>

      <main style={{ maxWidth: 780, margin: "0 auto", padding: 16 }}>
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
                      : s === "personal" || (s === "data" && personalInfo) || (s === "results" && analysisResults)
                      ? "#16a34a"
                      : "#9ca3af",
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </div>
              <span style={{ textTransform: "capitalize", fontSize: 14 }}>{s}</span>
              {i < 2 && <div style={{ width: 48, height: 2, background: "#e5e7eb" }} />}
            </div>
          ))}
        </div>

        {step === "personal" && <PersonalInfoForm onComplete={onPersonalComplete} />}

        {step === "data" && (
          <>
            <DataCollection onDataCollected={onDataCollected} apiFeatures={apiFeatures} />
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button
                onClick={() => setStep("personal")}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}
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
              uploadedRows={uploadedRows}
              onSave={manualSave}
            />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => setStep("data")}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}
              >
                ← Back
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={manualSave}
                  disabled={savedOnce}
                  title={savedOnce ? "Already saved" : "Save"}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: savedOnce ? "#94a3b8" : "#2563eb",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {savedOnce ? "Saved" : "Save"}
                </button>
                <button
                  onClick={() => {
                    setAnalysisResults(null);
                    setSavedOnce(false);
                    setAnalysisId(null);
                    setStep("personal");
                  }}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  New Analysis
                </button>
              </div>
            </div>
          </>
        )}

        {busy && (
          <div style={{ marginTop: 12, padding: 12, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8 }}>
            Running model…
          </div>
        )}
        {err && (
          <div style={{ marginTop: 12, padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#b91c1c" }}>
            {err}
          </div>
        )}
      </main>
    </>
  );
}
