import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getPredictionById } from "../../../src/lib/firebase";

// optional tiny helpers for labels/colors
function riskLabel(pred) {
  return pred === 2 ? "High" : pred === 1 ? "Moderate" : pred === 0 ? "Low" : "-";
}
function riskColor(label) {
  return label === "High" ? "#ef4444" : label === "Moderate" ? "#f59e0b" : "#10b981";
}

export default function PatientDetailPage() {
  const router = useRouter();
  const { userId, id } = router.query;

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!userId || !id) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const d = await getPredictionById(userId, id);
        setDoc(d);
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, id]);

  const firstRow = useMemo(() => (Array.isArray(doc?.rows) && doc.rows.length ? doc.rows[0] : {}), [doc]);
  const firstRes = useMemo(() => (doc?.apiResponse?.results?.[0] || {}), [doc]);
  const probs = firstRes.probs || [];
  const rLabel = riskLabel(firstRes.pred_risk);

  async function handlePrint() {
    window.print();
  }

  async function handleDownloadPDF() {
    try {
      const { default: jsPDF } = await import("jspdf");
      const auto = await import("jspdf-autotable");

      const docPdf = new jsPDF({ unit: "pt", format: "a4" });
      const pad = 24;

      docPdf.setFontSize(16);
      docPdf.text("REMInsight — Patient Report", pad, 40);

      docPdf.setFontSize(12);
      docPdf.text(`Record ID: ${id}`, pad, 64);
      docPdf.text(`User ID: ${userId}`, pad, 82);
      if (doc?.createdAtISO) docPdf.text(`Created: ${new Date(doc.createdAtISO).toLocaleString()}`, pad, 100);

      // Personal info
      docPdf.setFontSize(14);
      docPdf.text("Personal Information", pad, 130);
      docPdf.setFontSize(11);
      docPdf.text(`Name: ${doc?.personalInfo?.name ?? "-"}`, pad, 150);
      docPdf.text(`Age: ${doc?.personalInfo?.age ?? "-"}`, pad, 166);
      docPdf.text(`Gender: ${doc?.personalInfo?.gender ?? "-"}`, pad, 182);
      docPdf.text(`Sleep Quality: ${doc?.personalInfo?.sleepQuality ?? "-"}`, pad, 198);
      docPdf.text(`Sleep Duration: ${doc?.personalInfo?.sleepDuration ?? "-"} hrs`, pad, 214);
      if (Array.isArray(doc?.personalInfo?.sleepIssues) && doc.personalInfo.sleepIssues.length) {
        docPdf.text(`Sleep Issues: ${doc.personalInfo.sleepIssues.join(", ")}`, pad, 230);
      }
      if (doc?.personalInfo?.medicalFiles?.length) {
        docPdf.text(
          `Uploaded Medical Reports: ${doc.personalInfo.medicalFiles.map(m => m.name).join(", ")}`,
          pad, 246
        );
      }

      // Objective / First row snapshot
      docPdf.setFontSize(14);
      docPdf.text("Objective Snapshot", pad, 276);
      auto.default(docPdf, {
        startY: 286,
        head: [["PSQI", "REM_total_min", "REM_latency_min", "REM_pct"]],
        body: [[
          firstRow.psqi_global ?? "-",
          firstRow.REM_total_min ?? "-",
          firstRow.REM_latency_min ?? "-",
          firstRow.REM_pct ?? "-"
        ]],
        styles: { fontSize: 10 }
      });

      // Prediction
      let y = docPdf.lastAutoTable ? docPdf.lastAutoTable.finalY + 14 : 360;
      docPdf.setFontSize(14);
      docPdf.text("Prediction Result", pad, y);
      y += 10;
      docPdf.setFontSize(12);
      docPdf.text(`Risk: ${rLabel}`, pad, y + 16);
      auto.default(docPdf, {
        startY: y + 26,
        head: [["Low", "Moderate", "High"]],
        body: [[probs[0] ?? "-", probs[1] ?? "-", probs[2] ?? "-"]],
        styles: { fontSize: 10 }
      });

      docPdf.save(`REMInsight_${userId}_${id}.pdf`);
    } catch (e) {
      alert("Failed to generate PDF. Try using the Print button instead.");
      console.error(e);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <Head><title>Patient Report</title></Head>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>🧾 Patient Report</h1>
        <div style={{ display:"flex", gap:8 }}>
          <Link href="/admin">← Back</Link>
          <button onClick={handlePrint} style={btn}>Print</button>
          <button onClick={handleDownloadPDF} style={btnPrimary}>Download PDF</button>
        </div>
      </div>

      {err && <div style={alertErr}>{err}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : !doc ? (
        <div style={emptyBox}>No data</div>
      ) : (
        <div style={panel} id="print-root">
          <section style={{ marginBottom: 12 }}>
            <div style={h2}>Personal Information</div>
            <div style={grid2}>
              <KV k="Name" v={doc.personalInfo?.name} />
              <KV k="Age" v={doc.personalInfo?.age} />
              <KV k="Gender" v={doc.personalInfo?.gender} />
              <KV k="Sleep Quality" v={doc.personalInfo?.sleepQuality} />
              <KV k="Sleep Duration (h)" v={doc.personalInfo?.sleepDuration} />
            </div>
            {Array.isArray(doc.personalInfo?.sleepIssues) && doc.personalInfo.sleepIssues.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 13 }}>
                <b>Sleep Issues:</b> {doc.personalInfo.sleepIssues.join(", ")}
              </div>
            )}
            {doc.personalInfo?.medicalFiles?.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 13 }}>
                <b>Uploaded Medical Reports:</b>{" "}
                {doc.personalInfo.medicalFiles.map((m, i) => (
                  <span key={i}>{m.name}{i < doc.personalInfo.medicalFiles.length - 1 ? ", " : ""}</span>
                ))}
              </div>
            )}
          </section>

          <section style={{ marginBottom: 12 }}>
            <div style={h2}>Objective Snapshot</div>
            <div style={grid4}>
              <KV k="PSQI (global)" v={firstRow.psqi_global} />
              <KV k="REM total (min)" v={firstRow.REM_total_min} />
              <KV k="REM latency (min)" v={firstRow.REM_latency_min} />
              <KV k="REM %" v={firstRow.REM_pct} />
            </div>
          </section>

          <section>
            <div style={h2}>Prediction</div>
            <div style={{ fontWeight: 700, color: riskColor(rLabel), fontSize: 18, marginBottom: 6 }}>
              Risk: {rLabel}
            </div>
            <div style={grid3}>
              <KV k="P(Low)" v={probs[0]} />
              <KV k="P(Moderate)" v={probs[1]} />
              <KV k="P(High)" v={probs[2]} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"8px 10px" }}>
      <div style={{ fontSize:12, color:"#475569" }}>{k}</div>
      <div style={{ fontWeight:600 }}>{v ?? "-"}</div>
    </div>
  );
}

const panel = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:12 };
const btn = { padding:"8px 12px", borderRadius:8, background:"#e2e8f0", border:"none", cursor:"pointer" };
const btnPrimary = { ...btn, background:"#2563eb", color:"#fff" };
const h2 = { fontSize:16, fontWeight:700, marginBottom:8 };
const grid2 = { display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:8 };
const grid3 = { display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:8 };
const grid4 = { display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:8 };
const alertErr = { padding:12, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, color:"#991b1b" };
const emptyBox = { padding:16, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8 };
