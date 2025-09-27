import Head from "next/head";
import { useState, useMemo } from "react";

/**
 * This page implements your blueprint-style UI (simplified) and
 * posts the correct payload to FastAPI: POST /predict {rows:[{...}]}
 *
 * It collects BOTH Objective metrics and Subjective PSQI (either global OR components).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE; // must be set in Vercel

// --- Small helpers ---
function num(v, fallback = "") {
  if (v === "" || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function Home() {
  // ----- Step state -----
  const [step, setStep] = useState("personal"); // personal | data | results

  // ----- Personal info (blueprint style) -----
  const [personal, setPersonal] = useState({
    name: "",
    age: "",
    gender: "",
    medicalHistory: "",
    sleepQuality10: 5,       // blueprint slider 1..10 (informational only)
    sleepDurationHours: 7.0, // blueprint number (informational only)
    sleepIssues: [],         // array of strings
  });

  // ----- MODEL INPUTS (what your model actually needs) -----
  // Objective features
  const [obj, setObj] = useState({
    TST_min: "",
    REM_total_min: "",
    REM_latency_min: "",
    REM_pct: "",
    REM_density: "",
    sleep_efficiency_pct: "",
    micro_arousals_count: "",
    mean_delta_pow: "",
    mean_theta_pow: "",
    mean_alpha_pow: "",
    mean_beta_pow: "",
    artifact_pct: "",
    percent_epochs_missing: "",
  });

  // Subjective: PSQI
  const [psqiMode, setPsqiMode] = useState("global"); // "global" or "components"
  const [psqiGlobal, setPsqiGlobal] = useState("");
  const [psqiC, setPsqiC] = useState({
    psqi_c1: "",
    psqi_c2: "",
    psqi_c3: "",
    psqi_c4: "",
    psqi_c5: "",
    psqi_c6: "",
    psqi_c7: "",
  });

  // ----- Results -----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  // derived: PSQI sum when in components mode
  const psqiSum = useMemo(() => {
    if (psqiMode !== "components") return null;
    const vals = Object.values(psqiC).map(v => Number(v));
    if (vals.some(v => !Number.isFinite(v))) return null;
    return vals.reduce((a, b) => a + b, 0);
  }, [psqiMode, psqiC]);

  // ----- UI helpers -----
  const sleepIssueOptions = [
    "Insomnia",
    "Sleep Apnea",
    "Restless Leg Syndrome",
    "Narcolepsy",
    "Night Terrors",
    "Sleepwalking",
  ];

  function toggleIssue(issue) {
    setPersonal(p => {
      const exists = p.sleepIssues.includes(issue);
      return {
        ...p,
        sleepIssues: exists
          ? p.sleepIssues.filter(i => i !== issue)
          : [...p.sleepIssues, issue],
      };
    });
  }

  // ----- Submission → /predict -----
  async function analyze() {
    setError("");
    setLoading(true);
    setResults(null);

    try {
      if (!API_BASE) {
        throw new Error(
          "NEXT_PUBLIC_API_BASE is not configured in Vercel Project Settings."
        );
      }

      // Build one row for the API "rows": [...]
      const row = {
        // Objective (convert to numbers; leave "" out)
        TST_min:                 num(obj.TST_min, null),
        REM_total_min:           num(obj.REM_total_min, null),
        REM_latency_min:         num(obj.REM_latency_min, null),
        REM_pct:                 num(obj.REM_pct, null),
        REM_density:             num(obj.REM_density, null),
        sleep_efficiency_pct:    num(obj.sleep_efficiency_pct, null),
        micro_arousals_count:    num(obj.micro_arousals_count, null),
        mean_delta_pow:          num(obj.mean_delta_pow, null),
        mean_theta_pow:          num(obj.mean_theta_pow, null),
        mean_alpha_pow:          num(obj.mean_alpha_pow, null),
        mean_beta_pow:           num(obj.mean_beta_pow, null),
        artifact_pct:            num(obj.artifact_pct, null),
        percent_epochs_missing:  num(obj.percent_epochs_missing, null),
      };

      // Subjective (PSQI)
      if (psqiMode === "global") {
        const g = num(psqiGlobal, null);
        if (g === null) {
          throw new Error("Please enter PSQI Global (0–21) or switch to Components.");
        }
        row.psqi_global = g;
      } else {
        // Components mode: send c1..c7
        const c = {
          psqi_c1: num(psqiC.psqi_c1, null),
          psqi_c2: num(psqiC.psqi_c2, null),
          psqi_c3: num(psqiC.psqi_c3, null),
          psqi_c4: num(psqiC.psqi_c4, null),
          psqi_c5: num(psqiC.psqi_c5, null),
          psqi_c6: num(psqiC.psqi_c6, null),
          psqi_c7: num(psqiC.psqi_c7, null),
        };
        if (Object.values(c).some(v => v === null)) {
          throw new Error("Please fill all PSQI components (each 0–3).");
        }
        Object.assign(row, c);
      }

      // Remove nulls (so your API can impute missing objectively if any)
      Object.keys(row).forEach(k => row[k] === null && delete row[k]);

      const res = await fetch(`${API_BASE}/predict?explain=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [row] }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`API error (${res.status}): ${t}`);
      }
      const json = await res.json();

      // Expected: { results:[{pred_risk, probs:[] }], features_used:[...] }
      setResults(json);
      setStep("results");
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>REM Sleep Analysis Platform</title>
        {/* Tailwind via CDN for speed — matches your blueprint */}
        <script src="https://cdn.tailwindcss.com" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold">🧠 REM Sleep Analysis</h1>
            <nav className="text-sm space-x-4">
              <a className="text-gray-600 hover:text-gray-900" href="/api/health" onClick={e => e.preventDefault()}>Status</a>
              <span className="text-gray-300">|</span>
              <a className="text-gray-600 hover:text-gray-900" href={`${API_BASE || ""}/docs`} target="_blank" rel="noreferrer">API Docs</a>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Steps */}
          <div className="flex items-center justify-center gap-6 mb-8">
            {["personal","data","results"].map(s => (
              <div key={s} className="flex items-center">
                <button
                  className={`w-10 h-10 rounded-full font-semibold ${step===s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
                  onClick={() => setStep(s)}
                >
                  {s==="personal"?"👤":s==="data"?"📊":"📈"}
                </button>
                <span className={`ml-2 text-sm ${step===s?"text-blue-600":"text-gray-600"}`}>
                  {s==="personal"?"Personal":"data"===s?"Data":"Results"}
                </span>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
              {error}
            </div>
          )}

          {/* PERSONAL */}
          {step === "personal" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4">📋 Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input className="border rounded px-3 py-2" placeholder="Full Name"
                    value={personal.name} onChange={e=>setPersonal({...personal,name:e.target.value})}/>
                  <input type="number" min={1} max={120} className="border rounded px-3 py-2" placeholder="Age"
                    value={personal.age} onChange={e=>setPersonal({...personal,age:e.target.value})}/>
                  <select className="border rounded px-3 py-2"
                    value={personal.gender} onChange={e=>setPersonal({...personal,gender:e.target.value})}>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option><option value="female">Female</option>
                    <option value="other">Other</option><option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  <input type="number" step="0.5" min={1} max={12} className="border rounded px-3 py-2" placeholder="Avg Sleep Duration (h)"
                    value={personal.sleepDurationHours} onChange={e=>setPersonal({...personal,sleepDurationHours:e.target.value})}/>
                </div>
                <textarea className="border rounded px-3 py-2 w-full mt-3" rows={3} placeholder="Medical history..."
                  value={personal.medicalHistory} onChange={e=>setPersonal({...personal,medicalHistory:e.target.value})}/>
                <div className="mt-4">
                  <label className="text-sm font-medium">Sleep Issues</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {sleepIssueOptions.map(issue=>(
                      <label key={issue} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={personal.sleepIssues.includes(issue)} onChange={()=>toggleIssue(issue)}/>
                        {issue}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-6 text-right">
                  <button className="bg-blue-600 text-white rounded px-4 py-2"
                    onClick={()=>setStep("data")}>Continue → Data</button>
                </div>
              </section>

              {/* INFO CARD */}
              <section className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4">ℹ️ What happens next</h2>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                  <li>Next step collects **objective** metrics (TST, REM mins, latency, % etc.).</li>
                  <li>You’ll also provide **subjective** PSQI – either a **Global** score (0–21) OR **7 components** (0–3 each). The backend will derive the global if only components are sent.</li>
                  <li>We’ll send your inputs as <code>{`{ rows: [ {...} ] }`}</code> to the API and show the prediction.</li>
                </ul>
              </section>
            </div>
          )}

          {/* DATA */}
          {step === "data" && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">📊 Model Inputs</h2>

              {/* Subjective PSQI */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-3">
                  <span className="font-medium">Subjective (PSQI):</span>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="psqiMode" checked={psqiMode==="global"} onChange={()=>setPsqiMode("global")}/>
                    Global (0–21)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="psqiMode" checked={psqiMode==="components"} onChange={()=>setPsqiMode("components")}/>
                    Components (7 × 0–3)
                  </label>
                </div>

                {psqiMode==="global" ? (
                  <input type="number" min={0} max={21} className="border rounded px-3 py-2"
                         placeholder="PSQI Global (0–21)" value={psqiGlobal}
                         onChange={e=>setPsqiGlobal(e.target.value)} />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.keys(psqiC).map(k=>(
                      <input key={k} type="number" min={0} max={3} className="border rounded px-3 py-2"
                        placeholder={k.toUpperCase()} value={psqiC[k]}
                        onChange={e=>setPsqiC({...psqiC,[k]:e.target.value})}/>
                    ))}
                    <div className="col-span-full text-sm text-gray-600">
                      Sum preview: <b>{psqiSum ?? "-"}</b>
                    </div>
                  </div>
                )}
              </div>

              {/* Objective block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  ["TST_min","Total Sleep Time (min)"],
                  ["REM_total_min","REM Total (min)"],
                  ["REM_latency_min","REM Latency (min)"],
                  ["REM_pct","REM % of TST (0–100)"],
                  ["REM_density","REM Density (index)"],
                  ["sleep_efficiency_pct","Sleep Efficiency % (0–100)"],
                  ["micro_arousals_count","Micro Arousals (count)"],
                  ["mean_delta_pow","Mean Delta Power"],
                  ["mean_theta_pow","Mean Theta Power"],
                  ["mean_alpha_pow","Mean Alpha Power"],
                  ["mean_beta_pow","Mean Beta Power"],
                  ["artifact_pct","Artifact % (0–100)"],
                  ["percent_epochs_missing","% Epochs Missing (0–100)"],
                ].map(([key,label])=>(
                  <div key={key}>
                    <label className="block text-sm text-gray-700 mb-1">{label}</label>
                    <input
                      type="number"
                      className="border rounded px-3 py-2 w-full"
                      value={obj[key]}
                      onChange={e=>setObj({...obj,[key]:e.target.value})}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button className="px-4 py-2 rounded border" onClick={()=>setStep("personal")}>← Back</button>
                <button
                  className="px-4 py-2 rounded bg-purple-600 text-white disabled:bg-purple-300"
                  onClick={analyze}
                  disabled={loading}
                >
                  {loading ? "Analyzing..." : "🧠 Analyze with AI Model"}
                </button>
              </div>
            </div>
          )}

          {/* RESULTS */}
          {step === "results" && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">📈 Results</h2>

              {!results ? (
                <div className="text-gray-600">No results yet.</div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <div><b>features_used:</b> {results.features_used?.length ?? 0}</div>
                  </div>
                  <div className="border rounded p-4">
                    <div className="font-medium mb-2">Prediction</div>
                    <pre className="text-sm overflow-auto">{JSON.stringify(results.results?.[0], null, 2)}</pre>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <button className="px-4 py-2 rounded bg-blue-600 text-white"
                        onClick={()=>setStep("data")}>Analyze another</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
