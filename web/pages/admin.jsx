// web/pages/admin.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  listAllPredictions,
  exportArrayToCSV,
  normalizeDocForCSV
} from "../src/lib/firebase";

const PIN = process.env.NEXT_PUBLIC_ADMIN_PIN;

function riskLabel(pred) {
  return pred === 2 ? "High" : pred === 1 ? "Moderate" : pred === 0 ? "Low" : "-";
}
function riskColor(label) {
  return label === "High" ? "#ef4444" : label === "Moderate" ? "#f59e0b" : "#10b981";
}

export default function AdminPage() {
  const [authOk, setAuthOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  // filters
  const [qText, setQText] = useState("");
  const [risk, setRisk] = useState("all");  // all|low|moderate|high
  const [start, setStart] = useState("");   // YYYY-MM-DD
  const [end, setEnd] = useState("");

  const canvasRef = useRef(null);

  // PIN gate
  useEffect(() => {
    const cached = typeof window !== "undefined" ? sessionStorage.getItem("admin_auth") : null;
    if (cached && PIN && cached === PIN) {
      setAuthOk(true);
    } else {
      const attempt = prompt("Enter admin PIN:");
      if (PIN && attempt === PIN) {
        sessionStorage.setItem("admin_auth", attempt);
        setAuthOk(true);
      } else {
        setErr("Not authorized.");
        setLoading(false);
      }
    }
  }, []);

  // Load data
  useEffect(() => {
    if (!authOk) return;
    (async () => {
      setLoading(true);
      try {
        const data = await listAllPredictions(1000);
        // listAllPredictions returns createdAtISO; also add createdAtDate for convenience
        const withDate = data.map(d => ({
          ...d,
          createdAtDate: d.createdAtISO ? new Date(d.createdAtISO) : null
        }));
        setRows(withDate);
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [authOk]);

  // Derived filtered view
  const filtered = useMemo(() => {
    let out = rows;

    // date filter (client-side)
    if (start || end) {
      const fromMs = start ? new Date(start).getTime() : -Infinity;
      const toMs = end ? new Date(end).getTime() + 24*60*60*1000 - 1 : Infinity; // end of day
      out = out.filter(r => {
        const t = r.createdAtDate ? r.createdAtDate.getTime() : 0;
        return t >= fromMs && t <= toMs;
      });
    }

    // risk filter
    if (risk !== "all") {
      out = out.filter(r => {
        const pr = r.apiResponse?.results?.[0]?.pred_risk;
        const lbl = riskLabel(pr).toLowerCase();
        return lbl === risk;
      });
    }

    // text search (name/id/gender/age)
    if (qText.trim()) {
      const t = qText.trim().toLowerCase();
      out = out.filter(r =>
        (r.personalInfo?.name || "").toLowerCase().includes(t) ||
        (r.personalInfo?.gender || "").toLowerCase().includes(t) ||
        String(r.personalInfo?.age ?? "").includes(t) ||
        (r.id || "").toLowerCase().includes(t)
      );
    }

    return out;
  }, [rows, start, end, risk, qText]);

  // Summary
  const summary = useMemo(() => {
    const s = { total: filtered.length, low: 0, mod: 0, high: 0 };
    filtered.forEach(r => {
      const pr = r.apiResponse?.results?.[0]?.pred_risk;
      if (pr === 0) s.low++;
      else if (pr === 1) s.mod++;
      else if (pr === 2) s.high++;
    });
    return s;
  }, [filtered]);

  // Trend chart data (records per day)
  const trendData = useMemo(() => {
    const map = new Map(); // yyyy-mm-dd -> count
    filtered.forEach(r => {
      const d = r.createdAtDate;
      if (!d) return;
      const key = d.toISOString().slice(0,10);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [filtered]);

  // Render trend line on canvas
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const W = cvs.width, H = cvs.height;
    ctx.clearRect(0,0,W,H);

    if (!trendData.length) {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.fillText("No trend data", 10, 20);
      return;
    }

    const maxY = Math.max(...trendData.map(p => p.count), 1);

    // axes
    ctx.strokeStyle = "#94a3b8";
    ctx.beginPath();
    ctx.moveTo(40, H-30); ctx.lineTo(W-10, H-30);
    ctx.moveTo(40, H-30); ctx.lineTo(40, 10);
    ctx.stroke();

    // line
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    trendData.forEach((p, i) => {
      const x = 40 + (i/(trendData.length-1))*(W-60);
      const y = (H-30) - (p.count/maxY)*(H-50);
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();

    // date labels (first/last)
    ctx.fillStyle = "#475569";
    ctx.font = "12px sans-serif";
    if (trendData.length >= 1) {
      ctx.fillText(trendData[0].date, 40, H-10);
      ctx.fillText(trendData[trendData.length-1].date, W-100, H-10);
    }
  }, [trendData]);

  function exportCSV() {
    const normalized = filtered.map(normalizeDocForCSV);
    exportArrayToCSV("admin_predictions.csv", normalized, [
      "id","createdAt","userId","name","age","gender",
      "psqi_global","rem_total_min","rem_latency_min","rem_pct",
      "pred_risk","prob_low","prob_moderate","prob_high"
    ]);
  }

  if (!authOk) {
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
        <Head><title>Admin</title></Head>
        {err ? <div style={alertErr}>{err}</div> : <div>Authorizing…</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin:"24px auto", padding:16 }}>
      <Head><title>Admin Console</title></Head>

      {/* Top bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h1 style={{ margin:0 }}>🔧 Admin Console</h1>
        <div style={{ display:"flex", gap:8 }}>
          <Link href="/" style={{ lineHeight:"32px" }}>← Back</Link>
          <button onClick={exportCSV} style={btnPrimary}>⬇ Export CSV</button>
        </div>
      </div>

      {/* Filters */}
      <div style={panel}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12 }}>
          <div>
            <div style={label}>Search (name/id)</div>
            <input value={qText} onChange={e=>setQText(e.target.value)} placeholder="e.g., JJ or doc id" style={inp}/>
          </div>
          <div>
            <div style={label}>Risk</div>
            <select value={risk} onChange={e=>setRisk(e.target.value)} style={inp}>
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <div style={label}>Start date</div>
            <input type="date" value={start} onChange={e=>setStart(e.target.value)} style={inp}/>
          </div>
          <div>
            <div style={label}>End date</div>
            <input type="date" value={end} onChange={e=>setEnd(e.target.value)} style={inp}/>
          </div>
        </div>
      </div>

      {/* Summary + trend */}
      <div style={{ display:"grid", gridTemplateColumns:"2fr 3fr", gap:12, margin:"12px 0 16px" }}>
        <div style={panel}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            <KPI title="Total" value={summary.total} color="#334155" />
            <KPI title="Low" value={summary.low} color="#10b981" />
            <KPI title="Moderate" value={summary.mod} color="#f59e0b" />
            <KPI title="High" value={summary.high} color="#ef4444" />
          </div>
        </div>
        <div style={panel}>
          <div style={{ marginBottom:8, fontWeight:600 }}>Trend (records/day)</div>
          <canvas ref={canvasRef} width={600} height={160} />
        </div>
      </div>

      {/* Table */}
      <div style={{ ...panel, padding:0 }}>
        {loading ? (
          <div style={{ padding:12 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:12, color:"#64748b" }}>No records match your filters.</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>When</th>
                  <th style={th}>Name</th>
                  <th style={th}>Age</th>
                  <th style={th}>Gender</th>
                  <th style={th}>PSQI</th>
                  <th style={th}>Risk</th>
                  <th style={th}>Doc ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const firstRow = Array.isArray(r.rows) && r.rows.length ? r.rows[0] : {};
                  const pr = r.apiResponse?.results?.[0]?.pred_risk ?? null;
                  const label = riskLabel(pr);
                  return (
                    <tr key={r.id}>
                      <td style={td}>{r.createdAtDate ? r.createdAtDate.toLocaleString() : "-"}</td>
                      <td style={td}>{r.personalInfo?.name || "-"}</td>
                      <td style={td}>{r.personalInfo?.age ?? "-"}</td>
                      <td style={td}>{r.personalInfo?.gender || "-"}</td>
                      <td style={td}>{firstRow.psqi_global ?? "-"}</td>
                      <td style={{ ...td, fontWeight:600, color:riskColor(label) }}>{label}</td>
                      <td style={td}>{r.id}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
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

const panel = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:12 };
const label = { fontSize:12, color:"#475569", marginBottom:6 };
const inp = { padding:"8px 10px", border:"1px solid #e2e8f0", borderRadius:8, width:"100%" };
const btnPrimary = { padding:"8px 12px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer" };
const table = { width:"100%", borderCollapse:"collapse", fontSize:14, minWidth:900 };
const th = { textAlign:"left", padding:"10px 8px", borderBottom:"1px solid #e2e8f0", background:"#f8fafc" };
const td = { padding:"8px 8px", borderBottom:"1px solid #f1f5f9" };
const alertErr = { padding:12, background:"#fef2f2", border:"1px solid "#fecaca", borderRadius:8, color:"#991b1b" };
