// web/pages/patient/[userId]/[id].jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth, getPredictionById } from "../../../src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

function riskLabel(v) {
  return v === 2 ? "High" : v === 1 ? "Moderate" : v === 0 ? "Low" : "-";
}
function riskColor(label) {
  return label === "High" ? "#ef4444" : label === "Moderate" ? "#f59e0b" : "#10b981";
}

export default function PatientReportPage() {
  const router = useRouter();
  const { userId, id: rid, recordId: rid2 } = router.query;
  const recId = (rid ?? rid2) ? String(rid ?? rid2) : undefined;

  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const chartRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u || null);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId || !recId) return;
    if (loadingAuth) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const d = await getPredictionById(String(userId), String(recId));
        if (!d) setErr("Record not found.");
        else setDoc(d);
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, recId, loadingAuth]);

  const canView = authUser && (authUser.uid === userId || authUser.uid === ADMIN_UID);

  const probs = useMemo(() => {
    const pr = doc?.apiResponse?.results?.[0]?.probs || [];
    return pr.length ? pr : [0, 0, 0];
  }, [doc]);

  useEffect(() => {
    const cvs = chartRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const W = cvs.width, H = cvs.height;
    ctx.clearRect(0, 0, W, H);
    const labels = ["Low", "Moderate", "High"];
    const max = Math.max(...probs, 1);

    ctx.strokeStyle = "#94a3b8";
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(40, H - 30);
    ctx.lineTo(W - 10, H - 30);
    ctx.stroke();

    const bw = 60, gap = 30;
    const startX = 60;
    for (let i = 0; i < 3; i++) {
      const val = probs[i] || 0;
      const h = ((H - 60) * val) / max;
      const x = startX + i * (bw + gap);
      const y = (H - 30) - h;
      ctx.fillStyle = i === 0 ? "#10b981" : i === 1 ? "#f59e0b" : "#ef4444";
      ctx.fillRect(x, y, bw, h);
      ctx.fillStyle = "#334155";
      ctx.font = "12px sans-serif";
      ctx.fillText(labels[i], x + 8, H - 10);
      ctx.fillText(String(val.toFixed(3)), x + 6, y - 6);
    }
  }, [probs]);

  function doPrint() {
    window.print();
  }

  async function downloadPDF() {
    if (!doc) return;
    const firstRow = Array.isArray(doc.rows) && doc.rows.length ? doc.rows[0] : {};
    const firstRes = doc.apiResponse?.results?.[0] || {};
    const predLbl = riskLabel(firstRes.pred_risk);

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    pdf.setFontSize(16);
    pdf.text("REMInsight — Patient Report", 40, 40);

    pdf.setFontSize(11);
    pdf.text(`Report ID: ${doc.id}`, 40, 64);
    pdf.text(`User ID: ${doc.userId}`, 40, 80);
    pdf.text(`Created: ${doc.createdAtISO || "-"}`, 40, 96);

    pdf.setFontSize(13);
    pdf.text("Patient Information", 40, 124);
    pdf.autoTable({
      startY: 132,
      styles: { fontSize: 11 },
      head: [['Name','Age','Gender','Sleep Quality','Avg Sleep (h)']],
      body: [[
        doc.personalInfo?.name || "-",
        String(doc.personalInfo?.age ?? "-"),
        doc.personalInfo?.gender || "-",
        String(doc.personalInfo?.sleepQuality ?? "-"),
        String(doc.personalInfo?.sleepDuration ?? "-"),
      ]]
    });

    const probsArr = probs || [];
    pdf.setFontSize(13);
    pdf.text("Model Result", 40, (pdf.lastAutoTable?.finalY || 132) + 24);
    pdf.autoTable({
      startY: (pdf.lastAutoTable?.finalY || 132) + 30,
      styles: { fontSize: 11 },
      head: [['Risk','Prob (Low)','Prob (Moderate)','Prob (High)']],
      body: [[
        predLbl,
        String((probsArr[0]||0).toFixed(4)),
        String((probsArr[1]||0).toFixed(4)),
        String((probsArr[2]||0).toFixed(4)),
      ]]
    });

    pdf.setFontSize(13);
    pdf.text("Key Objective Inputs", 40, (pdf.lastAutoTable?.finalY || 132) + 24);
    pdf.autoTable({
      startY: (pdf.lastAutoTable?.finalY || 132) + 30,
      styles: { fontSize: 11 },
      head: [['PSQI Global','REM Total (min)','REM Latency (min)','REM %']],
      body: [[
        String(firstRow.psqi_global ?? "-"),
        String(firstRow.REM_total_min ?? "-"),
        String(firstRow.REM_latency_min ?? "-"),
        String(firstRow.REM_pct ?? "-"),
      ]]
    });

    try {
      const cvs = chartRef.current;
      if (cvs) {
        const img = cvs.toDataURL("image/png");
        pdf.setFontSize(13);
        pdf.text("Risk Probabilities", 40, (pdf.lastAutoTable?.finalY || 132) + 24);
        pdf.addImage(img, "PNG", 40, (pdf.lastAutoTable?.finalY || 132) + 30, 400, 180);
      }
    } catch {}

    pdf.save(`patient_${doc.userId}_${doc.id}.pdf`);
  }

  if (loading || loadingAuth) {
    return <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>Loading…</div>;
  }
  if (err) {
    return <div style={{ maxWidth: 900, margin: "40px auto", padding: 16, color: "#991b1b" }}>{err}</div>;
  }
  if (!doc) {
    return <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>Not found.</div>;
  }
  if (!canView) {
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
        <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b" }}>
          Permission denied: you are not authorized to view this record.
        </div>
      </div>
    );
  }

  const firstRow = Array.isArray(doc.rows) && doc.rows.length ? doc.rows[0] : {};
  const firstRes = doc.apiResponse?.results?.[0] || {};
  const predLbl = riskLabel(firstRes.pred_risk);

  return (
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: 16 }}>
      <Head><title>Patient Report</title></Head>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>🧾 Patient Report</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={authUser?.uid ? "/history" : "/"} style={{ lineHeight: "32px" }}>← Back</Link>
          <Link href={`/patient/${doc.userId}`} style={{ lineHeight: "32px" }}>History</Link>
          <button onClick={doPrint} style={btn}>🖨 Print</button>
          <button onClick={downloadPDF} style={btnPrimary}>⬇ Download PDF</button>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          <Info title="Report ID" value={doc.id} />
          <Info title="User ID" value={doc.userId} />
          <Info title="Created" value={doc.createdAtISO || "-"} />
          <Info title="Patient" value={doc.personalInfo?.name || "-"} />
          <Info title="Age" value={String(doc.personalInfo?.age ?? "-")} />
          <Info title="Gender" value={doc.personalInfo?.gender || "-"} />
          <Info title="Sleep Quality" value={String(doc.personalInfo?.sleepQuality ?? "-")} />
          <Info title="Avg Sleep (h)" value={String(doc.personalInfo?.sleepDuration ?? "-")} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Model Output</div>
          <div><b>Predicted Risk:</b> <span style={{ color: riskColor(predLbl), fontWeight: 700 }}>{predLbl}</span></div>
          <div style={{ marginTop: 8 }}>Probabilities</div>
          <ul style={{ marginTop: 4 }}>
            <li>Low: {(probs[0]||0).toFixed(4)}</li>
            <li>Moderate: {(probs[1]||0).toFixed(4)}</li>
            <li>High: {(probs[2]||0).toFixed(4)}</li>
          </ul>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Risk Probabilities (Chart)</div>
          <canvas ref={chartRef} width={520} height={220} />
        </div>
      </div>

      <div style={{ ...card, marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Key Objective Inputs</div>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>PSQI Global</th>
              <th style={th}>REM Total (min)</th>
              <th style={th}>REM Latency (min)</th>
              <th style={th}>REM %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={td}>{firstRow.psqi_global ?? "-"}</td>
              <td style={td}>{firstRow.REM_total_min ?? "-"}</td>
              <td style={td}>{firstRow.REM_latency_min ?? "-"}</td>
              <td style={td}>{firstRow.REM_pct ?? "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {doc.personalInfo?.medicalHistory ? (
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Medical History (Patient Provided)</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{doc.personalInfo.medicalHistory}</div>
        </div>
      ) : null}

      <style jsx global>{`
        @media print {
          a, button { display: none !important; }
          canvas { break-inside: avoid; }
          body { background: #fff; }
        }
      `}</style>
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:10 }}>
      <div style={{ fontSize:12, color:"#475569" }}>{title}</div>
      <div style={{ fontWeight:700 }}>{value}</div>
    </div>
  );
}

const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:12 };
const btn = { padding:"8px 12px", borderRadius:8, background:"#e2e8f0", border:"none", cursor:"pointer" };
const btnPrimary = { ...btn, background:"#2563eb", color:"#fff" };
const table = { width:"100%", borderCollapse:"collapse", fontSize:14 };
const th = { textAlign:"left", padding:"10px 8px", borderBottom:"1px solid #e2e8f0", background:"#f8fafc" };
const td = { padding:"8px 8px", borderBottom:"1px solid #f1f5f9" };
