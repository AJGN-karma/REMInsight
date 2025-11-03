// web/pages/history.jsx
import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  auth,
  ensureAnonAuth,
  onAuth,
  listPredictions,
  listPredictionsForUser,
  exportArrayToCSV,
  normalizeDocForCSV
} from "../src/lib/firebase";
import jsPDF from "jspdf";
import "jspdf-autotable";

const PIN = process.env.NEXT_PUBLIC_ADMIN_PIN;

export default function HistoryPage() {
  const [authOk, setAuthOk] = useState(false);  // For admin PIN
  const [patientMode, setPatientMode] = useState(false); // Patient vs admin
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);

  // ---------------------------
  // AUTH DETECTION
  // ---------------------------
  useEffect(() => {
    ensureAnonAuth();
    const unsub = onAuth(async (u) => {
      setUser(u);
      if (u) {
        setPatientMode(true);
        await loadPatientHistory(u.uid);
      } else {
        // If not a patient, check for admin PIN
        pinGate();
      }
    });
    return () => unsub && unsub();
  }, []);

  // ---------------------------
  // LOAD PATIENT DATA
  // ---------------------------
  async function loadPatientHistory(uid) {
    setLoading(true);
    try {
      const data = await listPredictionsForUser(uid, 200);
      setRows(data);
    } catch (e) {
      console.error(e);
      setErr("Failed to load patient history.");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------
  // ADMIN PIN GATE
  // ---------------------------
  function pinGate() {
    const cached = sessionStorage.getItem("hist_auth");
    if (cached && PIN && cached === PIN) {
      setAuthOk(true);
      loadAdminData();
    } else {
      const attempt = prompt("Enter admin PIN to view all patient histories:");
      if (PIN && attempt === PIN) {
        sessionStorage.setItem("hist_auth", attempt);
        setAuthOk(true);
        loadAdminData();
      } else {
        setErr("Not authorized.");
        setLoading(false);
      }
    }
  }

  // ---------------------------
  // LOAD ADMIN DATA
  // ---------------------------
  async function loadAdminData() {
    setLoading(true);
    try {
      const data = await listPredictions(300);
      setRows(data);
    } catch (e) {
      console.error(e);
      setErr("Failed to load admin records.");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------
  // SUMMARY
  // ---------------------------
  const summary = useMemo(() => {
    const out = { total: rows.length, low: 0, mod: 0, high: 0 };
    rows.forEach(r => {
      const pred = r.apiResponse?.results?.[0]?.pred_risk;
      if (pred === 0) out.low++;
      else if (pred === 1) out.mod++;
      else if (pred === 2) out.high++;
    });
    return out;
  }, [rows]);

  // ---------------------------
  // EXPORT (Admin only)
  // ---------------------------
  function exportCSV() {
    const normalized = rows.map(normalizeDocForCSV);
    exportArrayToCSV("predictions.csv", normalized, [
      "id","createdAt","name","age","gender",
      "psqi_global","rem_total_min","rem_latency_min","rem_pct",
      "pred_risk","prob_low","prob_moderate","prob_high"
    ]);
  }

  // ---------------------------
  // PDF DOWNLOAD (Patient only)
  // ---------------------------
  function downloadPDF(record) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("REMInsight - Patient Report", 14, 18);

    const when = record.createdAtDate
      ? record.createdAtDate.toLocaleString()
      : "-";
    const r = record.apiResponse?.results?.[0] || {};
    const probs = r.probs || [];

    doc.setFontSize(12);
    doc.text(`Name: ${record.personalInfo?.name || "-"}`, 14, 30);
    doc.text(`Age: ${record.personalInfo?.age ?? "-"}`, 14, 36);
    doc.text(`Gender: ${record.personalInfo?.gender || "-"}`, 14, 42);
    doc.text(`Date: ${when}`, 14, 48);

    doc.autoTable({
      startY: 60,
      head: [["Predicted Risk", "P(Low)", "P(Mod)", "P(High)"]],
      body: [
        [
          r.pred_risk === 2 ? "High" : r.pred_risk === 1 ? "Moderate" : "Low",
          (probs[0] ?? 0).toFixed(3),
          (probs[1] ?? 0).toFixed(3),
          (probs[2] ?? 0).toFixed(3),
        ],
      ],
    });

    doc.text(
      "Note: This is a screening result and not a medical diagnosis.",
      14,
      doc.lastAutoTable.finalY + 12
    );
    doc.save(`REMInsight_Report_${record.personalInfo?.name || "patient"}.pdf`);
  }

  // ---------------------------
  // RENDER
  // ---------------------------
  if (loading)
    return <div style={{ padding: 40 }}>Loading data...</div>;

  if (!patientMode && !authOk)
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
        <Head><title>History</title></Head>
        {err ? (
          <div style={alertErr}>{err}</div>
        ) : (
          <div>Authorizing…</div>
        )}
      </div>
    );

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: 16 }}>
      <Head><title>{patientMode ? "My History" : "Admin History"}</title></Head>

      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent:"space-between",
        alignItems:"center",
        marginBottom: 16
      }}>
        <h1 style={{ margin: 0 }}>
          {patientMode ? "🩺 My Diagnosis History" : "📚 Analyzed Patients"}
        </h1>
        <div>
          <Link href="/" style={{ marginRight: 12 }}>← Back</Link>
          {!patientMode && (
            <button onClick={exportCSV} style={btnPrimary}>⬇ Export CSV</button>
          )}
        </div>
      </div>

      {/* Stats */}
      {rows.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
          marginBottom: 16
        }}>
          <KPI title="Total Analyses" value={summary.total} color="#2563eb" />
          <KPI title="Low Risk" value={summary.low} color="#10b981" />
          <KPI title="Moderate Risk" value={summary.mod} color="#f59e0b" />
          <KPI title="High Risk" value={summary.high} color="#ef4444" />
        </div>
      )}

      {/* Records */}
      {rows.length === 0 ? (
        <div style={emptyBox}>No records found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>When</th>
                <th style={th}>Name</th>
                <th style={th}>Age</th>
                <th style={th}>Gender</th>
                <th style={th}>PSQI</th>
                <th style={th}>Risk</th>
                {patientMode ? <th style={th}>Action</th> : <th style={th}>ID</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const firstRow = Array.isArray(r.rows) && r.rows.length ? r.rows[0] : {};
                const pred = r.apiResponse?.results?.[0]?.pred_risk ?? null;
                const riskLabel = pred === 2 ? "High" : pred === 1 ? "Moderate" : pred === 0 ? "Low" : "-";
                return (
                  <tr key={r.id}>
                    <td style={td}>{r.createdAtDate ? r.createdAtDate.toLocaleString() : "-"}</td>
                    <td style={td}>{r.personalInfo?.name || "-"}</td>
                    <td style={td}>{r.personalInfo?.age ?? "-"}</td>
                    <td style={td}>{r.personalInfo?.gender || "-"}</td>
                    <td style={td}>{firstRow.psqi_global ?? "-"}</td>
                    <td style={{ ...td, fontWeight: 600, color: colorForRisk(riskLabel) }}>{riskLabel}</td>
                    <td style={td}>
                      {patientMode ? (
                        <button
                          onClick={() => downloadPDF(r)}
                          style={btnPrimary}>
                          ⬇ Download
                        </button>
                      ) : (
                        r.id
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- UI helpers ----------
function KPI({ title, value, color }) {
  return (
    <div style={{ background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:8, padding:12 }}>
      <div style={{ fontSize:12, color:"#475569" }}>{title}</div>
      <div style={{ fontSize:20, fontWeight:700, color }}>{value}</div>
    </div>
  );
}
function colorForRisk(r){ return r==="High"?"#ef4444":r==="Moderate"?"#f59e0b":"#10b981"; }
const btnPrimary = { padding:"6px 10px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer" };
const table = { width:"100%", borderCollapse:"collapse", fontSize:14, minWidth:720 };
const th = { textAlign:"left", padding:"8px 6px", borderBottom:"1px solid #e2e8f0" };
const td = { padding:"8px 6px", borderBottom:"1px solid #f1f5f9" };
const alertErr = { padding:12, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, color:"#991b1b" };
const emptyBox = { padding:16, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8 };
