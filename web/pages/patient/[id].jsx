// web/pages/patient/[id].jsx
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getPredictionById } from "../../src/lib/firebase";
import { downloadCSV } from "../../src/lib/export";

function friendlySummary(predRisk, avgProb, psqiGlobal) {
  const riskLabel = ["Low","Moderate","High"][predRisk] || "Unknown";
  const p = avgProb?.[predRisk] ?? null;

  const hints = [];
  if (psqiGlobal != null) {
    if (psqiGlobal >= 8) hints.push("PSQI indicates significant sleep quality concerns.");
    else if (psqiGlobal >= 5) hints.push("PSQI suggests mild-to-moderate sleep disturbance.");
    else hints.push("PSQI suggests generally good sleep quality.");
  }
  if (riskLabel === "High") {
    hints.push("Please consider consulting a clinician or sleep specialist.");
    hints.push("Short-term steps: regular sleep schedule, limit caffeine, track symptoms.");
  } else if (riskLabel === "Moderate") {
    hints.push("Follow-up screening and sleep hygiene improvements are recommended.");
  } else {
    hints.push("Maintain healthy habits (consistent routine, light exposure, exercise).");
  }
  const conf = p != null ? ` Model confidence for ${riskLabel}: ${(p*100).toFixed(1)}%.` : "";
  return { riskLabel, conf, hints };
}

export default function PatientPage() {
  const router = useRouter();
  const { id } = router.query;

  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      setBusy(true); setErr("");
      try {
        const d = await getPredictionById(String(id));
        setDoc(d);
      } catch (e) {
        setErr(String(e?.message || e));
      } finally {
        setBusy(false);
      }
    })();
  }, [id]);

  function exportThis() {
    if (!doc) return;
    // Make one row per uploaded row, attaching id & personalInfo & first prediction
    const pred = doc.apiResponse?.results?.[0] || {};
    const rows = (doc.rows || []).map((r, i) => ({
      doc_id: doc.id,
      row_index: i,
      createdAt: doc.createdAt?.seconds ? new Date(doc.createdAt.seconds*1000).toISOString() : "",
      name: doc.personalInfo?.name ?? "",
      age: doc.personalInfo?.age ?? "",
      gender: doc.personalInfo?.gender ?? "",
      pred_risk: pred.pred_risk ?? "",
      probs: pred.probs ? JSON.stringify(pred.probs) : "",
      ...r
    }));
    downloadCSV(`patient_${doc.id}.csv`, rows);
  }

  const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 };

  const riskIdx = doc?.apiResponse?.results?.[0]?.pred_risk ?? null;
  const risk = ["Low","Moderate","High"][riskIdx] ?? "-";
  const avgProb = (() => {
    const arr = doc?.apiResponse?.results || [];
    if (!arr.length) return [];
    const k = arr[0].probs.length;
    const sums = new Array(k).fill(0);
    arr.forEach(r => r.probs.forEach((p,i)=> sums[i]+=p));
    return sums.map(s => s/arr.length);
  })();
  const psqiGlobal = Array.isArray(doc?.rows) && doc.rows[0]?.psqi_global != null
    ? Number(doc.rows[0].psqi_global)
    : null;

  const friendly = friendlySummary(riskIdx ?? 1, avgProb, psqiGlobal);

  return (
    <>
      <Head><title>Patient • REMInsight</title></Head>
      <main style={{ maxWidth: 900, margin:"0 auto", padding:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <Link href="/history">← Back to History</Link>
          </div>
          {!!doc && <button onClick={exportThis} style={btn}>Export CSV</button>}
        </div>

        {busy && <div style={warn}>Loading…</div>}
        {err && <div style={errBox}>{err}</div>}

        {doc && (
          <div style={{ display:"grid", gap:12 }}>
            <div style={card}>
              <h2 style={{ marginTop:0 }}>👤 {doc.personalInfo?.name || "-"}</h2>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                <KPI title="Age" value={doc.personalInfo?.age ?? "-"} />
                <KPI title="Gender" value={doc.personalInfo?.gender ?? "-"} />
                <KPI title="PSQI Global" value={psqiGlobal ?? "-"} />
                <KPI title="Risk" value={risk} color={riskColor(risk)} />
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight:600, marginBottom:6 }}>Interpretation</div>
              <div style={{ color:"#334155" }}>
                Your screening suggests a <b>{friendly.riskLabel}</b> psychiatric risk pattern.{friendly.conf}
              </div>
              <ul style={{ marginTop:8, color:"#334155" }}>
                {friendly.hints.map((h,i)=><li key={i}>{h}</li>)}
              </ul>
              <div style={{ marginTop:8, fontSize:12, color:"#64748b" }}>
                This is a screening aid—not a diagnosis. Please consult a healthcare professional if you’re concerned.
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight:600, marginBottom:6 }}>Uploaded Row (first)</div>
              <pre style={pre}>
                {JSON.stringify(doc.rows?.[0] || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function KPI({ title, value, color }) {
  return (
    <div style={{ background:"#f3f4f6", borderRadius:12, padding:12, minWidth:160 }}>
      <div style={{ fontSize:12, color:"#475569" }}>{title}</div>
      <div style={{ fontSize:20, fontWeight:700, color: color || "#111827" }}>{value}</div>
    </div>
  );
}
function riskColor(r) { return r==="High" ? "#ef4444" : r==="Moderate" ? "#f59e0b" : "#10b981"; }
const btn = { padding:"8px 12px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer" };
const warn = { padding:12, background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8 };
const errBox = { padding:12, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, color:"#b91c1c" };
const pre = { margin:0, background:"#f8fafc", padding:12, borderRadius:8, overflowX:"auto" };
