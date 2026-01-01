// web/src/components/ResultsDashboard.jsx
import React, { useState } from "react";

// Patient-friendly text generator
function friendlySummary(predRisk, avgProb, psqiGlobal) {
  const riskLabel = ["Low", "Moderate", "High"][predRisk] || "Unknown";
  const p = avgProb?.[predRisk] ?? null;

  let msg = `Your screening suggests a ${riskLabel} psychiatric risk pattern.`;
  const hints = [];

  if (psqiGlobal != null) {
    if (psqiGlobal >= 8) hints.push("Your PSQI indicates significant sleep quality concerns.");
    else if (psqiGlobal >= 5) hints.push("Your PSQI suggests mild-to-moderate sleep disturbance.");
    else hints.push("Your PSQI suggests generally good sleep quality.");
  }

  if (riskLabel === "High") {
    hints.push("Please consult a clinician or sleep specialist for a full evaluation.");
    hints.push("Short-term steps: regular sleep schedule, reduce caffeine, track symptoms.");
  } else if (riskLabel === "Moderate") {
    hints.push("We recommend a follow-up screen and sleep hygiene improvements.");
    hints.push("If distress persists, seeking professional advice is helpful.");
  } else {
    hints.push("Keep healthy habits (consistent routine, light exposure, exercise).");
  }

  const conf = p != null ? ` The Analyze shows  ${riskLabel}: ${(p*100).toFixed(1)}%.` : "";
  return { riskLabel, text: msg + conf, hints };
}

export default function ResultsDashboard({ results, personalInfo, uploadedRows, onSave }) {
  const [tab, setTab] = useState("overview");

  const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 };

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

  const riskMap = ["Low","Moderate","High"];
  const first = results.results?.[0];

  const avgProb = (() => {
    const arr = results.results || [];
    if (!arr.length) return [];
    const k = arr[0].probs.length;
    const sums = new Array(k).fill(0);
    arr.forEach(r => r.probs.forEach((p,i)=> sums[i]+=p));
    return sums.map(s => s/arr.length);
  })();

  const psqiGlobal = (() => {
    if (!uploadedRows?.length) return null;
    const v = uploadedRows[0].psqi_global;
    return typeof v === "number" ? v : Number.isFinite(Number(v)) ? Number(v) : null;
  })();

  const friendly = friendlySummary(first?.pred_risk ?? 1, avgProb, psqiGlobal);

  return (
    <div style={card}>
      <h2 style={{ margin: 0, marginBottom: 12 }}>📈 Prediction Summary</h2>

      <div style={{ display:"flex", gap: 8, marginBottom: 12 }}>
        {[
          ["overview","📊 Overview"],
          ["probs","🎯 Class Probabilities"],
          ["personal","👤 Patient Details"]
        ].map(([k, label])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{
              padding:"8px 12px", borderRadius:8, border:"1px solid #d1d5db",
              background: tab===k ? "#fff" : "#f3f4f6", cursor:"pointer"
            }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div style={{ display:"grid", gap: 12, gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))" }}>
            <KPI title="Predicted Risk" value={friendly.riskLabel} color={colorForRisk(friendly.riskLabel)} />
            <KPI title="Rows Analyzed" value={`${results.results?.length || 0}`} color="#0ea5e9" />
            {psqiGlobal != null && <KPI title="PSQI Global" value={`${psqiGlobal}`} color="#8b5cf6" />}
          </div>

          <div style={{ marginTop: 16, padding: 16, background:"#f9fafb", borderRadius:12 }}>
            <div style={{ fontWeight:600, marginBottom: 6 }}>What this means</div>
            <div style={{ color:"#334155" }}>{friendly.text}</div>
            <ul style={{ marginTop: 8, color:"#334155" }}>
              {friendly.hints.map((h,i)=><li key={i}>{h}</li>)}
            </ul>
            <div style={{ marginTop: 8, fontSize: 12, color:"#64748b" }}>
              This is a screening aid—not a diagnosis. If you feel distressed, please consult a healthcare professional.
            </div>
          </div>

          <div style={{ marginTop: 12, textAlign:"right" }}>
            <button onClick={onSave} style={btnPrimary}>💾 Save to Patient History</button>
          </div>
        </>
      )}

      {tab === "probs" && (
        <div style={{ background:"#f9fafb", padding:16, borderRadius:12 }}>
          <div style={{ fontWeight:600, marginBottom: 8 }}>Average Class Probabilities</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
            <thead>
              <tr><th style={th}>Class</th><th style={th}>Probability</th></tr>
            </thead>
            <tbody>
              {avgProb.map((p,i)=>(
                <tr key={i}>
                  <td style={td}>{riskMap[i] || i}</td>
                  <td style={td}>{p.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize:12, color:"#64748b" }}>
            Probabilities are model outputs based on REM features + PSQI.
          </div>
        </div>
      )}

      {tab === "personal" && (
        <div style={{ display:"grid", gap: 12, gridTemplateColumns:"repeat(auto-fit, minmax(220px,1fr))" }}>
          <InfoCard title="Basic Information">
            <Row k="Name" v={personalInfo?.name || "-"} />
            <Row k="Age" v={personalInfo?.age ?? "-"} />
            <Row k="Gender" v={personalInfo?.gender || "-"} />
          </InfoCard>
          <InfoCard title="Sleep Patterns">
            <Row k="Sleep Quality" v={personalInfo?.sleepQuality != null ? `${personalInfo.sleepQuality}/10` : "-"} />
            <Row k="Sleep Duration" v={personalInfo?.sleepDuration != null ? `${personalInfo.sleepDuration}h` : "-"} />
          </InfoCard>
          {!!(personalInfo?.sleepIssues || []).length && (
            <InfoCard title="Reported Sleep Issues">
              <div style={{ display:"flex", flexWrap:"wrap", gap: 8 }}>
                {personalInfo.sleepIssues.map(x=>(
                  <span key={x} style={{ background:"#fef3c7", padding:"4px 8px", borderRadius:9999 }}>{x}</span>
                ))}
              </div>
            </InfoCard>
          )}
          {personalInfo?.medicalHistory && (
            <InfoCard title="Medical History">
              <div style={{ whiteSpace:"pre-wrap" }}>{personalInfo.medicalHistory}</div>
            </InfoCard>
          )}
        </div>
      )}
    </div>
  );
}

function KPI({ title, value, color }) {
  return (
    <div style={{ background:"#f3f4f6", borderRadius:12, padding:12 }}>
      <div style={{ fontSize:12, color:"#475569" }}>{title}</div>
      <div style={{ fontSize:20, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div style={{ background:"#f9fafb", borderRadius:12, padding:16 }}>
      <div style={{ fontWeight:600, marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );
}
function Row({ k, v }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
      <div style={{ color:"#6b7280" }}>{k}:</div>
      <div style={{ fontWeight:600 }}>{v}</div>
    </div>
  );
}
function colorForRisk(r) {
  return r==="High" ? "#ef4444" : r==="Moderate" ? "#f59e0b" : "#10b981";
}
const btnPrimary = { padding:"10px 14px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer" };
const th = { textAlign:"left", padding:"8px 4px", borderBottom:"1px solid #e5e7eb" };
const td = { padding:"6px 4px", borderBottom:"1px solid #f1f5f9" };
