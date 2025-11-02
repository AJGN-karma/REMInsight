// web/pages/patient/[id].jsx
import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getPredictionById } from "../../src/lib/firebase";

export default function PatientDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const d = await getPredictionById(id);
        if (!d) setErr("Record not found");
        setDoc(d);
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const firstRow = useMemo(() => (doc?.rows?.[0] || {}), [doc]);
  const firstRes = useMemo(() => (doc?.apiResponse?.results?.[0] || {}), [doc]);
  const probs = firstRes.probs || [];
  const riskLabel = firstRes.pred_risk === 2 ? "High" : firstRes.pred_risk === 1 ? "Moderate" : firstRes.pred_risk === 0 ? "Low" : "-";

  return (
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: 16 }}>
      <Head><title>Patient Detail</title></Head>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>👤 Patient Detail</h1>
        <div>
          <Link href="/history">← Back to History</Link>
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div style={alertErr}>{err}</div>
      ) : !doc ? (
        <div style={emptyBox}>No record.</div>
      ) : (
        <>
          {/* Top cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 16 }}>
            <Card>
              <Title>Basic Info</Title>
              <Row k="Name" v={doc.personalInfo?.name || "-"} />
              <Row k="Age" v={doc.personalInfo?.age ?? "-"} />
              <Row k="Gender" v={doc.personalInfo?.gender || "-"} />
              <Row k="Created" v={doc.createdAtDate ? doc.createdAtDate.toLocaleString() : "-"} />
            </Card>
            <Card>
              <Title>PSQI & REM</Title>
              <Row k="PSQI Global" v={firstRow.psqi_global ?? "-"} />
              <Row k="REM total (min)" v={firstRow.REM_total_min ?? "-"} />
              <Row k="REM latency (min)" v={firstRow.REM_latency_min ?? "-"} />
              <Row k="REM %" v={firstRow.REM_pct ?? "-"} />
            </Card>
            <Card>
              <Title>Prediction</Title>
              <div style={{ fontWeight:700, fontSize: 20, color: colorForRisk(riskLabel) }}>{riskLabel}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                Screening support only — not a diagnosis.
              </div>
            </Card>
          </div>

          {/* Probabilities chart */}
          <Card>
            <Title>Class Probabilities</Title>
            <div style={{ display:"grid", gap:10, maxWidth: 420 }}>
              {["Low","Moderate","High"].map((lbl, i) => (
                <div key={lbl}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize: 12, color:"#475569" }}>
                    <div>{lbl}</div>
                    <div>{probs[i] != null ? (probs[i]*100).toFixed(1)+"%" : "-"}</div>
                  </div>
                  <div style={{ height: 10, background:"#e5e7eb", borderRadius: 9999, overflow:"hidden" }}>
                    <div style={{
                      width: probs[i] != null ? `${probs[i]*100}%` : "0%",
                      height: "100%",
                      background: i===2 ? "#ef4444" : i===1 ? "#f59e0b" : "#10b981"
                    }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Raw uploaded row preview */}
          <Card>
            <Title>Uploaded Data (first row)</Title>
            <div style={{ overflowX:"auto" }}>
              <table style={table}>
                <thead>
                  <tr>{Object.keys(firstRow).map(h => <th style={th} key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  <tr>{Object.keys(firstRow).map(h => <td style={td} key={h}>{String(firstRow[h])}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Card({ children }) {
  return <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:16 }}>{children}</div>;
}
function Title({ children }) {
  return <div style={{ fontWeight:600, marginBottom:8 }}>{children}</div>;
}
function Row({ k, v }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
      <div style={{ color:"#6b7280" }}>{k}</div>
      <div style={{ fontWeight:600 }}>{v}</div>
    </div>
  );
}
function colorForRisk(r) {
  return r==="High" ? "#ef4444" : r==="Moderate" ? "#f59e0b" : "#10b981";
}
const table = { width:"100%", borderCollapse:"collapse", fontSize:14, minWidth: 600 };
const th = { textAlign:"left", padding:"8px 6px", borderBottom:"1px solid #e2e8f0" };
const td = { padding:"8px 6px", borderBottom:"1px solid #f1f5f9", whiteSpace:"nowrap" };
const alertErr = { padding:12, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, color:"#991b1b" };
const emptyBox = { padding:16, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8 };
