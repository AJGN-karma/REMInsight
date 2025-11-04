// web/pages/patient/[userId]/[recordId].jsx
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  getPredictionById,
  getMedicalFileURL,
} from "../../../src/lib/firebase";

const PIN = process.env.NEXT_PUBLIC_ADMIN_PIN; // same PIN you use for admin/history

export default function PatientRecordPage() {
  const router = useRouter();
  const { userId, recordId } = router.query;

  const [authOk, setAuthOk] = useState(false);
  const [err, setErr] = useState("");
  const [record, setRecord] = useState(null);
  const [pdfLinks, setPdfLinks] = useState([]); // [{name,url}]
  const [loading, setLoading] = useState(true);

  // Simple admin PIN gate
  useEffect(() => {
    if (!router.isReady) return;
    const cached = typeof window !== "undefined" ? sessionStorage.getItem("admin_auth") : null;
    if (cached && PIN && cached === PIN) {
      setAuthOk(true);
    } else {
      const attempt = prompt("Admin PIN required:");
      if (PIN && attempt === PIN) {
        sessionStorage.setItem("admin_auth", attempt);
        setAuthOk(true);
      } else {
        setErr("Not authorized.");
      }
    }
  }, [router.isReady]);

  useEffect(() => {
    if (!authOk || !userId || !recordId) return;
    (async () => {
      try {
        setLoading(true);
        const rec = await getPredictionById(String(userId), String(recordId));
        if (!rec) throw new Error("Record not found");
        setRecord(rec);

        const files = Array.isArray(rec.personalInfo?.medicalFiles)
          ? rec.personalInfo.medicalFiles
          : [];

        // Build temporary object URLs for PDFs
        const links = [];
        for (const f of files) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const { url, name } = await getMedicalFileURL(String(userId), String(f.id));
            links.push({ name: f.name || name, url });
          } catch (e) {
            console.warn("Failed to reconstruct PDF:", f, e);
          }
        }
        setPdfLinks(links);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [authOk, userId, recordId]);

  function printPage() {
    window.print();
  }

  if (!authOk) {
    return (
      <div style={{ maxWidth: 900, margin:"40px auto", padding:16 }}>
        <Head><title>Patient Record</title></Head>
        {err ? <div style={alertErr}>{err}</div> : <div>Authorizing…</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin:"24px auto", padding:16 }}>
      <Head>
        <title>Patient Record</title>
        <style>{printCSS}</style>
      </Head>

      <div className="no-print" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <Link href="/admin">← Back to Admin</Link>
        <button onClick={printPage} style={btnPrimary}>🖨 Print</button>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : !record ? (
        <div style={alertErr}>Record not found.</div>
      ) : (
        <div style={card}>
          <h1 style={{ marginTop:0 }}>🧑‍⚕️ Patient Report</h1>

          <section style={section}>
            <h3 style={h3}>Personal Info</h3>
            <Row label="Name" value={record.personalInfo?.name || "-"} />
            <Row label="Age" value={record.personalInfo?.age ?? "-"} />
            <Row label="Gender" value={record.personalInfo?.gender || "-"} />
            <Row label="Sleep Quality" value={`${record.personalInfo?.sleepQuality ?? "-"} / 10`} />
            <Row label="Avg Sleep Duration" value={`${record.personalInfo?.sleepDuration ?? "-"} h`} />
            <Row label="Sleep Issues" value={(record.personalInfo?.sleepIssues || []).join(", ") || "-"} />
            <Row label="Medical History" value={record.personalInfo?.medicalHistory || "-"} />
          </section>

          <section style={section}>
            <h3 style={h3}>Model Result</h3>
            {renderResult(record)}
          </section>

          <section style={section}>
            <h3 style={h3}>Objective Snapshot</h3>
            {renderObjective(record)}
          </section>

          <section style={section}>
            <h3 style={h3}>Medical Reports (PDF)</h3>
            {pdfLinks.length === 0 ? (
              <div style={{ color:"#64748b" }}>No reports uploaded for this session.</div>
            ) : (
              <ul>
                {pdfLinks.map((f, i) => (
                  <li key={i}>
                    <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ fontSize:12, color:"#64748b" }}>
              (When patient requests a printed report, this page includes report names only. PDFs are for admin view.)
            </div>
          </section>

          <section style={section}>
            <div style={{ fontSize:12, color:"#64748b" }}>
              Created: {record.createdAtDate ? record.createdAtDate.toLocaleString() : "-"} |
              &nbsp;User ID: {record.userId} | Record ID: {record.id}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/* UI helpers */
function Row({ label, value }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:8, marginBottom:6 }}>
      <div style={{ color:"#475569" }}>{label}</div>
      <div style={{ fontWeight:600 }}>{value}</div>
    </div>
  );
}

function renderResult(rec) {
  const res = rec.apiResponse?.results?.[0] || {};
  const probs = res.probs || [];
  const risk =
    res.pred_risk === 2 ? "High" :
    res.pred_risk === 1 ? "Moderate" :
    res.pred_risk === 0 ? "Low" : "-";
  const color =
    risk === "High" ? "#ef4444" :
    risk === "Moderate" ? "#f59e0b" : "#10b981";

  return (
    <div style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:18, fontWeight:700 }}>
          Predicted Risk: <span style={{ color }}>{risk}</span>
        </div>
        <div style={{ fontSize:12, color:"#64748b" }}>
          (Low / Moderate / High): {probs.map(p => (p*100).toFixed(1)+"%").join(" / ")}
        </div>
      </div>
      <div style={{ fontSize:13, marginTop:8 }}>
        {rec.apiResponse?.what_this_means ||
          "This is a screening aid—not a diagnosis. Consult a healthcare professional if you feel distressed."}
      </div>
    </div>
  );
}

function renderObjective(rec) {
  const row = Array.isArray(rec.rows) && rec.rows.length ? rec.rows[0] : {};
  const grid = { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:8 };
  const chip = { background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"8px 10px" };
  const items = [
    ["PSQI Global", row.psqi_global],
    ["REM total (min)", row.REM_total_min],
    ["REM latency (min)", row.REM_latency_min],
    ["REM %", row.REM_pct],
  ];
  return (
    <div style={grid}>
      {items.map(([k,v])=>(
        <div key={k} style={chip}>
          <div style={{ fontSize:12, color:"#64748b" }}>{k}</div>
          <div style={{ fontSize:16, fontWeight:700 }}>{v ?? "-"}</div>
        </div>
      ))}
    </div>
  );
}

const btnPrimary = { padding:"8px 12px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer" };
const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 };
const section = { marginTop:16 };
const h3 = { margin:"0 0 8px 0" };
const alertErr = { padding:12, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, color:"#991b1b" };

const printCSS = `
@media print {
  .no-print { display: none !important; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  a[href]:after { content: ""; } /* hide URLs after links */
}
`;
