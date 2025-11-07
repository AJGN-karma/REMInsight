import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { db } from "../src/lib/firebase";
import { collectionGroup, getDocs, query, orderBy, limit } from "firebase/firestore";

// ---------- tiny chart helpers (no deps) ----------
function drawAxes(ctx, W, H, pad) {
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, H - pad);
  ctx.lineTo(W - pad, H - pad);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pad, H - pad);
  ctx.lineTo(pad, pad);
  ctx.stroke();
}
function drawBars(canvas, labels, values, title = "") {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, pad = 36;
  ctx.clearRect(0, 0, W, H);
  drawAxes(ctx, W, H, pad);
  const maxV = Math.max(1, ...values);
  const slot = (W - pad * 2) / Math.max(values.length, 1);
  const barW = slot * 0.6;
  const gap = slot * 0.4;

  values.forEach((v, i) => {
    const x = pad + i * (barW + gap) + gap * 0.5;
    const h = (v / maxV) * (H - pad * 2);
    const y = H - pad - h;
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(x, y, barW, h);
    ctx.fillStyle = "#0f172a";
    ctx.font = "12px system-ui,-apple-system,Segoe UI,Roboto";
    ctx.textAlign = "center";
    ctx.fillText(String(labels[i]), x + barW / 2, H - pad + 14);
    ctx.fillStyle = "#334155";
    ctx.fillText(String(v), x + barW / 2, y - 6);
  });
  if (title) {
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 14px system-ui,-apple-system,Segoe UI,Roboto";
    ctx.textAlign = "left";
    ctx.fillText(title, pad, pad - 12);
  }
}
function drawLine(canvas, labels, values, title = "") {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height, pad = 36;
  ctx.clearRect(0, 0, W, H);
  drawAxes(ctx, W, H, pad);
  const maxV = Math.max(...values, 1);
  const minV = Math.min(...values, 0);
  const span = Math.max(1e-6, maxV - minV);

  const xs = values.map((_, i) => pad + (i / Math.max(1, values.length - 1)) * (W - pad * 2));
  const ys = values.map(v => H - pad - ((v - minV) / span) * (H - pad * 2));

  ctx.beginPath();
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2;
  xs.forEach((x, i) => (i === 0 ? ctx.moveTo(x, ys[i]) : ctx.lineTo(x, ys[i])));
  ctx.stroke();
  ctx.fillStyle = "#10b981";
  xs.forEach((x, i) => { ctx.beginPath(); ctx.arc(x, ys[i], 3, 0, Math.PI * 2); ctx.fill(); });

  ctx.fillStyle = "#334155";
  ctx.font = "12px system-ui,-apple-system,Segoe UI,Roboto";
  ctx.textAlign = "center";
  const step = Math.ceil(labels.length / 6);
  labels.forEach((lab, i) => {
    if (i % step === 0 || i === labels.length - 1) ctx.fillText(String(lab), xs[i], H - pad + 14);
  });

  if (title) {
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 14px system-ui,-apple-system,Segoe UI,Roboto";
    ctx.textAlign = "left";
    ctx.fillText(title, pad, pad - 12);
  }
}

// ---------- page ----------
export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const barRef = useRef(null);
  const lineRef = useRef(null);
  const confRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const qy = query(
          collectionGroup(db, "predictions"),
          orderBy("createdAt", "desc"),
          limit(500)
        );
        const snap = await getDocs(qy);
        const arr = [];
        snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
        setDocs(arr);
      } catch (e) {
        // If missing index, tell the user exactly what to do
        if (String(e.code) === "failed-precondition") {
          setErr(
            "This dashboard needs a Firestore collection-group index on predictions.createdAt (desc). " +
            "Create it in Firestore → Indexes → Composite: Collection group = predictions, Field = createdAt (Descending)."
          );
        } else {
          setErr(String(e));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // aggregates
  const { dist, timeline, confTrend } = useMemo(() => {
    const dist = [0, 0, 0];
    const timeline = [];
    const confTrend = [];
    const dayMap = new Map();

    docs.forEach(d => {
      const r0 = d.apiResponse?.results?.[0];
      if (!r0) return;
      const pred = Number(r0.pred_risk ?? 1);
      if (pred === 0 || pred === 1 || pred === 2) dist[pred] = (dist[pred] || 0) + 1;

      const probs = Array.isArray(r0.probs) ? r0.probs : [];
      const maxP = probs.length ? Math.max(...probs) : null;
      if (maxP != null) confTrend.push(maxP);

      const ts = d.createdAt?.toDate ? d.createdAt.toDate()
        : (d.createdAt?._seconds ? new Date(d.createdAt._seconds * 1000) : null);
      const dayKey = ts ? ts.toISOString().slice(0, 10) : "unknown";
      if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
      dayMap.get(dayKey).push(pred);
    });

    const days = Array.from(dayMap.keys()).sort();
    days.forEach(k => {
      const arr = dayMap.get(k);
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      timeline.push({ date: k, avg });
    });

    return { dist, timeline, confTrend };
  }, [docs]);

  // draw charts
  useEffect(() => {
    if (barRef.current) drawBars(barRef.current, ["Low", "Moderate", "High"], dist, "Risk Distribution");
    if (lineRef.current) {
      if (timeline.length) {
        drawLine(lineRef.current, timeline.map(t => t.date), timeline.map(t => t.avg),
          "Average Predicted Risk Over Time (0=Low, 2=High)");
      } else {
        const ctx = lineRef.current.getContext("2d");
        ctx.clearRect(0, 0, lineRef.current.width, lineRef.current.height);
        ctx.fillStyle = "#64748b";
        ctx.font = "12px sans-serif";
        ctx.fillText("No trend data", 10, 20);
      }
    }
    if (confRef.current) {
      if (confTrend.length) {
        drawLine(confRef.current, confTrend.map((_, i) => i + 1), confTrend, "Prediction Confidence Trend");
      } else {
        const ctx = confRef.current.getContext("2d");
        ctx.clearRect(0, 0, confRef.current.width, confRef.current.height);
        ctx.fillStyle = "#64748b";
        ctx.font = "12px sans-serif";
        ctx.fillText("No confidence data", 10, 20);
      }
    }
  }, [dist, timeline, confTrend]);

  const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 };

  return (
    <>
      <Head>
        <title>Patient Analytics Dashboard • REMInsight</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>
      <main style={{ maxWidth: 1000, margin: "16px auto", padding: 16 }}>
        <h1 style={{ margin: "0 0 12px 0" }}>📊 Patient Analytics Dashboard</h1>

        {loading && <div style={card}>Loading…</div>}
        {err && <div style={{...card, color:"#b91c1c", background:"#fef2f2"}}>Error: {err}</div>}

        {!loading && !err && (
          <>
            <div style={{ display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fit, minmax(220px,1fr))", marginBottom:12 }}>
              <KPI title="Records Analyzed" value={docs.length} color="#2563eb" />
              <KPI title="Low / Mod / High" value={`${dist[0]||0} / ${dist[1]||0} / ${dist[2]||0}`} color="#0ea5e9" />
              <KPI title="Avg Confidence" value={
                docs.length && confTrend.length ? (confTrend.reduce((a,b)=>a+b,0)/confTrend.length*100).toFixed(1)+"%" : "—"
              } color="#10b981" />
            </div>

            <div style={{ display:"grid", gap:12, gridTemplateColumns:"1fr 1fr", marginBottom:12 }}>
              <div style={card}><canvas ref={barRef} width={450} height={260} /></div>
              <div style={card}><canvas ref={confRef} width={450} height={260} /></div>
            </div>

            <div style={card}>
              <canvas ref={lineRef} width={940} height={300} />
              <div style={{ fontSize:12, color:"#64748b", marginTop:6 }}>
                Note: we don’t store ground-truth labels; confidence is a proxy, not accuracy.
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function KPI({ title, value, color }) {
  return (
    <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:12 }}>
      <div style={{ fontSize:12, color:"#475569" }}>{title}</div>
      <div style={{ fontSize:20, fontWeight:700, color }}>{value}</div>
    </div>
  );
}
