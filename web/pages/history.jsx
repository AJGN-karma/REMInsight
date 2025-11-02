// web/pages/history.jsx
import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  listPredictions,
  exportArrayToCSV,
  normalizeDocForCSV
} from "../src/lib/firebase";

const PIN = process.env.NEXT_PUBLIC_ADMIN_PIN;

export default function HistoryPage() {
  const [authOk, setAuthOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    // simple client-side PIN gate
    const cached = sessionStorage.getItem("hist_auth");
    if (cached && PIN && cached === PIN) {
      setAuthOk(true);
    } else {
      // eslint-disable-next-line no-alert
      const attempt = prompt("Enter admin PIN to view history:");
      if (PIN && attempt === PIN) {
        sessionStorage.setItem("hist_auth", attempt);
        setAuthOk(true);
      } else {
        setErr("Not authorized.");
      }
    }
  }, []);

  useEffect(() => {
    if (!authOk) return;
    (async () => {
      setLoading(true);
      try {
        const data = await listPredictions(200);
        setRows(data);
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [authOk]);

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

  function exportCSV() {
    const normalized = rows.map(normalizeDocForCSV);
    exportArrayToCSV("predictions.csv", normalized, [
      "id","createdAt","name","age","gender",
      "psqi_global","rem_total_min","rem_latency_min","rem_pct",
      "pred_risk","prob_low","prob_moderate","prob_high"
    ]);
  }

  if (!authOk) {
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
        <Head><title>History</title></Head>
        {err ? <div style={alertErr}>{err}</div> : <div>Authorizing…</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: 16 }}>
      <Head><title>History</title></Head>

      <div style={{ display: "flex", justifyContent:"space-between", alignItems:"center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>📚 Analyzed Patients</h1>
        <div>
          <Link href="/" style={{ marginRight: 12 }}>← Back to App</Link>
          <button onClick={exportCSV} style={btnPrimary}>⬇ Export CSV</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 16 }}>
        <KPI title="Total Analyses" value={summary.total} color="#2563eb" />
        <KPI title="Low Risk" value={summary.low} color="#10b981" />
        <KPI title="Moderate Risk" value={summary.mod} color="#f59e0b" />
        <KPI title="High Risk" value={summary.high} color="#ef4444" />
      </div>

      {/* Simple stacked bar */}
      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:12, marginBottom:16 }}>
        <div style={{ marginBottom: 8, fontWeight:600 }}>Distribution</div>
        <div style={{ height: 14, width: "100%", background:"#e5e7eb", borderRadius: 9999, overflow: "hidden" }}>
          <div style={{ width: pct(summary.low, summary.total), background:"#10b981", height: "100%", display:"inline-block" }} />
          <div style={{ width: pct(summary.mod, summary.total), background:"#f59e0b", height: "100%", display:"inline-block" }} />
          <div style={{ width: pct(summary.high, summary.total), background:"#ef4444", height: "100%", display:"inline-block" }} />
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={emptyBox}>No records yet.</div>
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
                <th style={th}>Actions</th>
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
                      <Link href={`/patient/${r.id}`} style={{ color:"#2563eb" }}>View</Link>
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

function KPI({ title, value, color }) {
  return (
    <div style={{ background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:8, padding:12 }}>
      <div style={{ fontSize:12, color:"#475569" }}>{title}</div>
      <div style={{ fontSize:20, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

function pct(n, total) {
  if (!total) return "0%";
  return `${(100 * n / total).toFixed(1)}%`;
}
function colorForRisk(r) {
  return r==="High" ? "#ef4444" : r==="Moderate" ? "#f59e0b" : "#10b981";
}
const btnPrimary = { padding:"8px 12px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer" };
const table = { width:"100%", borderCollapse:"collapse", fontSize:14, minWidth: 720 };
const th = { textAlign:"left", padding:"10px 8px", borderBottom:"1px solid #e2e8f0" };
const td = { padding:"8px 8px", borderBottom:"1px solid #f1f5f9" };
const alertErr = { padding:12, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, color:"#991b1b" };
const emptyBox = { padding:16, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8 };
