// web/pages/history.jsx
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { listPredictions } from "../src/lib/firebase";
import { downloadCSV } from "../src/lib/export";

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setBusy(true);
      setErr("");
      try {
        const data = await listPredictions();
        setItems(data);
      } catch (e) {
        setErr(String(e?.message || e));
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  function exportAll() {
    // Flatten minimal, but include nested fields as JSON strings
    const rows = items.map((d) => ({
      id: d.id,
      createdAt: d.createdAt?.seconds ? new Date(d.createdAt.seconds*1000).toISOString() : "",
      name: d.personalInfo?.name ?? "",
      age: d.personalInfo?.age ?? "",
      gender: d.personalInfo?.gender ?? "",
      psqi_global: firstRow(d)?.psqi_global ?? "",
      pred_risk: d.apiResponse?.results?.[0]?.pred_risk ?? "",
      probs: d.apiResponse?.results?.[0]?.probs ? JSON.stringify(d.apiResponse.results[0].probs) : "",
      rows_json: d.rows ? JSON.stringify(d.rows) : ""
    }));
    downloadCSV("rem_insight_predictions_all.csv", rows);
  }

  function firstRow(d) {
    return Array.isArray(d.rows) && d.rows.length ? d.rows[0] : null;
  }

  const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 };

  return (
    <>
      <Head><title>History • REMInsight</title></Head>
      <main style={{ maxWidth: 1024, margin:"0 auto", padding:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <h2 style={{ margin:0 }}>📚 Patient History</h2>
          <div>
            <Link href="/" style={{ marginRight:8, textDecoration:"none" }}>← Back</Link>
            <button onClick={exportAll} style={btn}>Export CSV</button>
          </div>
        </div>

        {busy && <div style={warn}>Loading…</div>}
        {err && <div style={errBox}>{err}</div>}

        {!busy && !err && (
          <div style={card}>
            {items.length === 0 ? (
              <div style={{ color:"#64748b" }}>No records yet.</div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
                <thead>
                  <tr>
                    <th style={th}>When</th>
                    <th style={th}>Name</th>
                    <th style={th}>Age</th>
                    <th style={th}>Risk</th>
                    <th style={th}>PSQI</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d)=> {
                    const riskIdx = d.apiResponse?.results?.[0]?.pred_risk ?? null;
                    const risk = ["Low","Moderate","High"][riskIdx] ?? "-";
                    const when = d.createdAt?.seconds ? new Date(d.createdAt.seconds*1000).toLocaleString() : "-";
                    return (
                      <tr key={d.id}>
                        <td style={td}>{when}</td>
                        <td style={td}>{d.personalInfo?.name ?? "-"}</td>
                        <td style={td}>{d.personalInfo?.age ?? "-"}</td>
                        <td style={td}>{risk}</td>
                        <td style={td}>{firstRow(d)?.psqi_global ?? "-"}</td>
                        <td style={td}>
                          <Link href={`/patient/${d.id}`} style={{ color:"#2563eb" }}>View</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </>
  );
}

const btn = { padding:"8px 12px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer" };
const th = { textAlign:"left", padding:"8px 6px", borderBottom:"1px solid #e5e7eb" };
const td = { padding:"8px 6px", borderBottom:"1px solid #f1f5f9" };
const warn = { padding:12, background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8 };
const errBox = { padding:12, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, color:"#b91c1c" };
