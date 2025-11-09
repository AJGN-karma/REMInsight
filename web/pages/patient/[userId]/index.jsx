// web/pages/patient/[userId]/index.jsx
import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth, listPredictionsByUser } from "../../../src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

function riskLabel(v) { return v === 2 ? "High" : v === 1 ? "Moderate" : v === 0 ? "Low" : "-"; }
function riskColor(label) { return label === "High" ? "#ef4444" : label === "Moderate" ? "#f59e0b" : "#10b981"; }

export default function PatientHistoryPage() {
  const router = useRouter();
  const { userId } = router.query;

  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u || null);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const canView = authUser && (authUser.uid === userId || authUser.uid === ADMIN_UID);

  useEffect(() => {
    if (!userId || loadingAuth || !canView) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await listPredictionsByUser(String(userId), 200);
        setRows(data || []);
      } catch (e) {
        setErr(String(e?.message || e));
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, loadingAuth, canView]);

  const patient = useMemo(() => {
    const newest = rows[0];
    return newest?.personalInfo || {};
  }, [rows]);

  async function downloadAllPDF() {
    if (!rows.length) return;

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 40;

    // Header
    pdf.setFontSize(16);
    pdf.text("REMInsight — Patient Full History", marginX, 40);
    pdf.setFontSize(11);
    pdf.text(`Patient User ID: ${userId}`, marginX, 60);
    pdf.text(`Records: ${rows.length}`, marginX, 76);

    // Patient info overview
    pdf.setFontSize(13);
    pdf.text("Patient Information (latest)", marginX, 100);
    pdf.autoTable({
      startY: 108,
      styles: { fontSize: 11 },
      head: [["Name", "Age", "Gender", "Sleep Quality", "Avg Sleep (h)"]],
      body: [[
        patient?.name || "-",
        String(patient?.age ?? "-"),
        patient?.gender || "-",
        String(patient?.sleepQuality ?? "-"),
        String(patient?.sleepDuration ?? "-"),
      ]],
    });

    // Per-visit table
    pdf.setFontSize(13);
    pdf.text("Visit History", marginX, (pdf.lastAutoTable?.finalY || 108) + 24);

    const tableRows = rows.map((r) => {
      const res0 = r?.apiResponse?.results?.[0] || {};
      const probs = Array.isArray(res0?.probs) ? res0.probs : [];
      const low = (probs[0] ?? 0).toFixed(3);
      const mod = (probs[1] ?? 0).toFixed(3);
      const high = (probs[2] ?? 0).toFixed(3);
      return [ r.createdAtISO || "-", riskLabel(res0.pred_risk), low, mod, high, r.id ];
    });

    pdf.autoTable({
      startY: (pdf.lastAutoTable?.finalY || 108) + 30,
      styles: { fontSize: 10 },
      head: [["When (ISO)", "Result", "P(Low)", "P(Mod)", "P(High)", "Record ID"]],
      body: tableRows,
    });

    pdf.save(`patient_${userId}_full_history.pdf`);
  }

  if (loadingAuth) {
    return <div style={{ maxWidth: 1000, margin: "24px auto", padding: 16 }}>Loading…</div>;
  }
  if (!canView) {
    return (
      <div style={{ maxWidth: 1000, margin: "24px auto", padding: 16 }}>
        <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b" }}>
          Permission denied: you are not authorized to view this patient’s history.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: 16 }}>
      <Head><title>Patient History</title></Head>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>👤 Patient History</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={authUser?.uid ? "/history" : "/"} style={{ lineHeight: "32px" }}>← Back</Link>
          <button onClick={downloadAllPDF} style={btnPrimary} disabled={!rows.length}>⬇ Download Full History (PDF)</button>
        </div>
      </div>

      {/* Patient summary */}
      <div style={panel}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          <Info title="Name" value={patient?.name || "-"} />
          <Info title="Age" value={String(patient?.age ?? "-")} />
          <Info title="Gender" value={patient?.gender || "-"} />
          <Info title="Sleep Quality" value={String(patient?.sleepQuality ?? "-")} />
          <Info title="Avg Sleep (h)" value={String(patient?.sleepDuration ?? "-")} />
          <Info title="Total Visits" value={String(rows.length)} />
        </div>
      </div>

      {/* Visits table */}
      <div style={{ ...panel, padding: 0, marginTop: 12 }}>
        {loading ? (
          <div style={{ padding: 12 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 12, color: "#64748b" }}>No history yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>When</th>
                  <th style={th}>Result</th>
                  <th style={th}>P(Low)</th>
                  <th style={th}>P(Mod)</th>
                  <th style={th}>P(High)</th>
                  <th style={th}>Record</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const res0 = r?.apiResponse?.results?.[0] || {};
                  const probs = Array.isArray(res0?.probs) ? res0.probs : [];
                  const rl = riskLabel(res0?.pred_risk);
                  const when = r?.createdAtDate
                    ? r.createdAtDate
                    : (r?.createdAt?.toDate ? r.createdAt.toDate() : null);
                  return (
                    <tr key={r.id}>
                      <td style={td}>{when ? when.toLocaleString() : "-"}</td>
                      <td style={{ ...td, fontWeight: 600, color: riskColor(rl) }}>{rl}</td>
                      <td style={td}>{(probs[0] ?? 0).toFixed(3)}</td>
                      <td style={td}>{(probs[1] ?? 0).toFixed(3)}</td>
                      <td style={td}>{(probs[2] ?? 0).toFixed(3)}</td>
                      <td style={td} title={r.id}>{r.id}</td>
                      <td style={td}><Link href={`/patient/${r.userId}/${r.id}`} style={{ color: "#2563eb" }}>View</Link></td>
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

function Info({ title, value }) {
  return (
    <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:10 }}>
      <div style={{ fontSize:12, color:"#475569" }}>{title}</div>
      <div style={{ fontWeight:700 }}>{value}</div>
    </div>
  );
}

const panel = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:12 };
const btnPrimary = { padding:"8px 12px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer" };
const table = { width:"100%", borderCollapse:"collapse", fontSize:14, minWidth: 900 };
const th = { textAlign:"left", padding:"10px 8px", borderBottom:"1px solid #e2e8f0", background:"#f8fafc" };
const td = { padding:"8px 8px", borderBottom:"1px solid #f1f5f9" };
