import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth, listPredictionsByUser } from "../../../src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

function riskLabel(v){ return v===2?"High":v===1?"Moderate":v===0?"Low":"-"; }
function riskColor(l){ return l==="High"?"#ef4444":l==="Moderate"?"#f59e0b":"#10b981"; }

export default function PatientHistoryPage(){
  const { query } = useRouter();
  const userId = query.userId ? String(query.userId) : undefined;

  const [authUser,setAuthUser] = useState(null);
  const [loadingAuth,setLoadingAuth] = useState(true);
  const [rows,setRows] = useState([]);
  const [loading,setLoading] = useState(true);
  const [err,setErr] = useState("");

  useEffect(()=>onAuthStateChanged(auth, u=>{ setAuthUser(u||null); setLoadingAuth(false); }),[]);
  const canView = authUser && (authUser.uid === userId || authUser.uid === ADMIN_UID);

  useEffect(()=>{
    if (!userId || loadingAuth) return;
    (async ()=>{
      try{
        setLoading(true); setErr("");
        const data = await listPredictionsByUser(userId, 500);
        setRows(data);
      } catch(e){ setErr(String(e)); }
      finally{ setLoading(false); }
    })();
  },[userId,loadingAuth]);

  const sorted = useMemo(
    () => rows.slice().sort((a,b)=>(b.createdAtDate?.getTime()||0)-(a.createdAtDate?.getTime()||0)),
    [rows]
  );

  function downloadFullHistoryPDF(){
    if (!sorted.length) return;
    const latest = sorted[0];
    const info = latest.personalInfo || {};
    const pdf = new jsPDF({ unit:"pt", format:"a4" });

    pdf.setFontSize(16);
    pdf.text("REMInsight — Patient Full History", 40, 40);

    pdf.setFontSize(11);
    pdf.text(`Patient UID: ${userId}`, 40, 60);
    pdf.text(`Total visits: ${sorted.length}`, 40, 76);

    // Latest personal info snapshot
    pdf.setFontSize(13);
    pdf.text("Current Personal Information", 40, 100);
    pdf.autoTable({
      startY: 108,
      styles: { fontSize: 11 },
      head: [['Name','Age','Gender','Sleep Quality','Avg Sleep (h)']],
      body: [[
        info.name || "-",
        String(info.age ?? "-"),
        info.gender || "-",
        String(info.sleepQuality ?? "-"),
        String(info.sleepDuration ?? "-")
      ]]
    });

    let y = (pdf.lastAutoTable?.finalY || 108) + 20;
    pdf.setFontSize(13);
    pdf.text("Visit History", 40, y); y += 8;

    // Each visit
    for (let i=0;i<sorted.length;i++){
      const d = sorted[i];
      const first = Array.isArray(d.rows) && d.rows.length ? d.rows[0] : {};
      const r0 = d.apiResponse?.results?.[0] || {};
      const probs = Array.isArray(r0.probs) ? r0.probs : [0,0,0];
      const lbl = riskLabel(r0.pred_risk);

      y += 16;
      pdf.setFontSize(12);
      pdf.setTextColor(51,65,85);
      pdf.text(`• Visit ${sorted.length - i}  —  ${d.createdAtISO || "-"}`, 40, y);
      y += 6;
      pdf.setTextColor(0,0,0);

      pdf.autoTable({
        startY: y + 8,
        styles: { fontSize: 11 },
        head: [['Risk','Prob (Low)','Prob (Moderate)','Prob (High)']],
        body: [[ lbl, (probs[0]||0).toFixed(4), (probs[1]||0).toFixed(4), (probs[2]||0).toFixed(4) ]],
        theme: 'grid',
        headStyles: { fillColor: [241,245,249], textColor: [15,23,42] }
      });

      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 8,
        styles: { fontSize: 11 },
        head: [['PSQI Global','REM Total (min)','REM Latency (min)','REM %']],
        body: [[
          String(first.psqi_global ?? "-"),
          String(first.REM_total_min ?? "-"),
          String(first.REM_latency_min ?? "-"),
          String(first.REM_pct ?? "-"),
        ]],
        theme: 'grid',
        headStyles: { fillColor: [248,250,252], textColor: [71,85,105] }
      });

      y = pdf.lastAutoTable.finalY + 10;
      if (y > 760) { pdf.addPage(); y = 40; }
    }

    // Optional: latest patient-provided notes
    if (latest.personalInfo?.medicalHistory) {
      if (y > 720) { pdf.addPage(); y = 40; }
      pdf.setFontSize(13);
      pdf.text("Medical History (Patient Provided)", 40, y + 10);
      const text = String(latest.personalInfo.medicalHistory);
      const wrapped = pdf.splitTextToSize(text, 520);
      pdf.setFontSize(11);
      pdf.text(wrapped, 40, y + 28);
    }

    pdf.save(`patient_${userId}_full_history.pdf`);
  }

  if (loading || loadingAuth) return <div style={{ maxWidth:900, margin:"40px auto", padding:16 }}>Loading…</div>;
  if (!canView) return <div style={{ maxWidth:900, margin:"40px auto", padding:16, color:"#991b1b" }}>Permission denied.</div>;
  if (err) return <div style={{ maxWidth:900, margin:"40px auto", padding:16, color:"#991b1b" }}>{err}</div>;

  return (
    <div style={{ maxWidth:1100, margin:"24px auto", padding:16 }}>
      <Head><title>Patient History</title></Head>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <h1 style={{ margin:0 }}>🗂 Patient History</h1>
        <div style={{ display:"flex", gap:8 }}>
          <Link href="/admin" style={{ lineHeight:"32px" }}>← Admin</Link>
          <button onClick={downloadFullHistoryPDF} style={btnPrimary}>⬇ Download Full History (A4 PDF)</button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={emptyBox}>No records found for this patient.</div>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>When</th>
                <th style={th}>Risk</th>
                <th style={th}>Low</th>
                <th style={th}>Moderate</th>
                <th style={th}>High</th>
                <th style={th}>PSQI</th>
                <th style={th}>Doc ID</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r=>{
                const first = Array.isArray(r.rows) && r.rows.length ? r.rows[0] : {};
                const r0 = r.apiResponse?.results?.[0] || {};
                const probs = r0.probs || [0,0,0];
                const lbl = riskLabel(r0.pred_risk);
                return (
                  <tr key={r.id}>
                    <td style={td}>{r.createdAtDate ? r.createdAtDate.toLocaleString() : "-"}</td>
                    <td style={{...td, fontWeight:700, color:riskColor(lbl)}}>{lbl}</td>
                    <td style={td}>{(probs[0]||0).toFixed(3)}</td>
                    <td style={td}>{(probs[1]||0).toFixed(3)}</td>
                    <td style={td}>{(probs[2]||0).toFixed(3)}</td>
                    <td style={td}>{first.psqi_global ?? "-"}</td>
                    <td style={td}>{r.id}</td>
                    <td style={td}>
                      <Link href={`/patient/${r.userId}/${r.id}`} style={{ color:"#2563eb" }}>View report</Link>
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

const btnPrimary = { padding:"8px 12px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer" };
const table = { width:"100%", borderCollapse:"collapse", fontSize:14, minWidth:900 };
const th = { textAlign:"left", padding:"10px 8px", borderBottom:"1px solid #e2e8f0", background:"#f8fafc" };
const td = { padding:"8px 8px", borderBottom:"1px solid #f1f5f9" };
const emptyBox = { padding:16, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8 };
