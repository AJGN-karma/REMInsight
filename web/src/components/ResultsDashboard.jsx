import React, { useState } from "react";

export default function ResultsDashboard({ results, personalInfo }) {
  const [tab, setTab] = useState("overview");

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

  const preds = results.results || [];
  const riskMap = ["Low", "Medium", "High"];
  const counts = [0,0,0];
  preds.forEach(p => { counts[p.pred_risk] = (counts[p.pred_risk]||0)+1; });
  const total = Math.max(1, preds.length);
  const percentages = counts.map(n => ((n/total)*100).toFixed(1));

  return (
    <div style={card}>
      <h2 style={h2}>📈 Prediction Summary</h2>

      <div style={tabs}>
        {[
          ["overview","📊 Overview"],
          ["rows","🧾 Per-Row Predictions"],
          ["probs","🎯 Class Probabilities (Avg)"],
          ["personal","👤 Personal Info"]
        ].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{...tabBtn, background: tab===k ? "#fff" : "#f3f4f6"}}>
            {l}
          </button>
        ))}
      </div>

      {tab==="overview" && (
        <>
          <div style={gridAuto}>
            <Stat title="Low Risk" value={`${percentages[0]}%`} color="#10b981" />
            <Stat title="Medium Risk" value={`${percentages[1]}%`} color="#f59e0b" />
            <Stat title="High Risk" value={`${percentages[2]}%`} color="#ef4444" />
          </div>

          <div style={panel}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Model Confidence</div>
            <div style={{ fontSize: 14, color: "#374151" }}>
              Predicted psychiatric risk category for the first row is{" "}
              <b>{riskMap[preds[0]?.pred_risk ?? 1]}</b>.
              Check <b>Per-Row Predictions</b> tab for all rows.
            </div>
          </div>
        </>
      )}

      {tab==="rows" && (
        <div style={panel}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Per-Row Predictions</div>
          <table style={table}>
            <thead>
              <tr><th>#</th><th>Predicted Risk</th><th>Prob (Low)</th><th>Prob (Med)</th><th>Prob (High)</th></tr>
            </thead>
            <tbody>
              {preds.map((r,i)=>(
                <tr key={i}>
                  <td>{i+1}</td>
                  <td>{riskMap[r.pred_risk]}</td>
                  <td>{r.probs?.[0]?.toFixed(3)}</td>
                  <td>{r.probs?.[1]?.toFixed(3)}</td>
                  <td>{r.probs?.[2]?.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==="probs" && (
        <div style={panel}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Average Class Probabilities</div>
          <table style={table}>
            <thead><tr><th>Class</th><th>Probability</th></tr></thead>
            <tbody>
              {[0,1,2].map(c=>{
                const avg = preds.length
                  ? (preds.map(p=>p.probs?.[c]||0).reduce((a,b)=>a+b,0) / preds.length)
                  : 0;
                return <tr key={c}><td>{riskMap[c]}</td><td>{avg.toFixed(3)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab==="personal" && (
        <div style={panel}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Subjective Snapshot</div>
          <div style={grid2}>
            <InfoRow k="Name" v={personalInfo?.name || "—"} />
            <InfoRow k="Age" v={personalInfo?.age ?? "—"} />
            <InfoRow k="Gender" v={personalInfo?.gender || "—"} />
            <InfoRow k="Sleep Quality" v={
              personalInfo?.sleepQuality ? `${personalInfo.sleepQuality}/10` : "—"
            } />
            <InfoRow k="Sleep Duration" v={
              personalInfo?.sleepDuration ? `${personalInfo.sleepDuration}h` : "—"
            } />
          </div>
          {(personalInfo?.sleepIssues || []).length > 0 && (
            <div style={{marginTop:12}}>
              <div style={{fontWeight:600, marginBottom:6}}>Reported Sleep Issues</div>
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                {personalInfo.sleepIssues.map(s=>(
                  <span key={s} style={chip}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {personalInfo?.medicalHistory && (
            <div style={{marginTop:12}}>
              <div style={{fontWeight:600, marginBottom:6}}>Medical History</div>
              <div style={{whiteSpace:"pre-wrap"}}>{personalInfo.medicalHistory}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ title, value, color }) {
  return (
    <div style={{ background:"#f3f4f6", borderRadius:12, padding:12 }}>
      <div style={{ fontSize:20, fontWeight:700, color }}>{value}</div>
      <div style={{ fontSize:12, color:"#374151" }}>{title}</div>
    </div>
  );
}
function InfoRow({k,v}) {
  return (
    <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
      <div style={{color:"#6b7280"}}>{k}:</div>
      <div style={{fontWeight:600}}>{v}</div>
    </div>
  );
}

const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 };
const h2 = { margin:0, marginBottom:12, fontSize:20, fontWeight:700 };
const tabs = { display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" };
const tabBtn = { padding:"8px 12px", borderRadius:8, border:"1px solid #d1d5db", cursor:"pointer" };
const panel = { marginTop:16, background:"#f9fafb", borderRadius:12, padding:16 };
const gridAuto = { display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))" };
const table = { width:"100%", borderCollapse:"collapse", fontSize:14 };
const grid2 = { display:"grid", gap:12, gridTemplateColumns:"1fr 1fr" };
const chip = { background:"#fef3c7", padding:"4px 8px", borderRadius:9999 };
