import React, { useEffect, useState } from "react";
import { getFeatures } from "../lib/api";

export default function DataCollection({ onDataCollected }) {
  const [features, setFeatures] = useState(null);
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(()=>{
    (async()=>{
      try {
        const f = await getFeatures();
        setFeatures(f.features || null);
      } catch(e) {
        setFeatures(null); // still allow uploads; we’ll not validate if API can’t tell us
      }
    })();
  },[]);

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(",").map(h=>h.trim());
    return lines.slice(1).map(line=>{
      const cells = line.split(",");
      const obj = {};
      headers.forEach((h, i)=> { obj[h] = (cells[i]??"").trim(); });
      return obj;
    });
  }

  async function handleFile(file){
    setError(""); setMsg("");
    if (!file) return;

    const text = await file.text();
    let parsed = [];

    if (file.name.toLowerCase().endsWith(".json")) {
      // JSON can be single object or array
      const json = JSON.parse(text);
      parsed = Array.isArray(json) ? json : [json];
    } else if (file.name.toLowerCase().endsWith(".csv")) {
      parsed = parseCSV(text);
    } else {
      setError("Only CSV or JSON are supported for now.");
      return;
    }

    if (!parsed.length) {
      setError("No rows detected in the file.");
      return;
    }

    // If we have features list from API, validate
    if (features && features.length) {
      const missing = features.filter(f => !(f in parsed[0]));
      if (missing.length) {
        setError(
          `Missing required columns: ${missing.join(", ")}. ` +
          `Make sure your header row matches /features exactly.`
        );
        return;
      }
    }

    setRows(parsed);
    setMsg(`Loaded ${parsed.length} row(s).`);
  }

  async function analyze(){
    setError("");
    if (!rows.length) {
      setError("Please upload a CSV or JSON with at least 1 row.");
      return;
    }
    // Normalize a few numeric-looking fields commonly used
    const normalized = rows.map(r => ({
      ...r,
      age: r.age !== undefined ? Number(r.age) : r.age,
      psqi_global: r.psqi_global !== undefined ? Number(r.psqi_global) : r.psqi_global,
      REM_total_min: r.REM_total_min !== undefined ? Number(r.REM_total_min) : r.REM_total_min,
      REM_latency_min: r.REM_latency_min !== undefined ? Number(r.REM_latency_min) : r.REM_latency_min,
      REM_pct: r.REM_pct !== undefined ? Number(r.REM_pct) : r.REM_pct
    }));
    onDataCollected(normalized);
  }

  return (
    <div style={card}>
      <h2 style={h2}>📁 Objective Data Upload (CSV / JSON)</h2>

      <p style={{marginTop:0, color:"#374151"}}>
        Upload patient-night rows with columns that match your model’s <code>/features</code>.
      </p>

      <div style={uploader}>
        <input
          type="file"
          accept=".csv,application/json"
          onChange={(e)=>handleFile(e.target.files?.[0])}
        />
      </div>

      {features && features.length > 0 && (
        <div style={hintBox}>
          <div style={{fontWeight:600, marginBottom:6}}>Required feature columns from API (/features)</div>
          <div style={{fontSize:12, color:"#374151", lineHeight:"20px"}}>
            {features.join(", ")}
          </div>
        </div>
      )}

      {msg && <div style={okBox}>{msg}</div>}
      {error && <div style={errBox}>{error}</div>}

      <div style={{marginTop:12, textAlign:"right"}}>
        <button onClick={analyze} style={btnPrimary}>🧠 Analyze with AI →</button>
      </div>
    </div>
  );
}

const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 };
const h2 = { margin:0, marginBottom:12, fontSize:20, fontWeight:700 };
const uploader = { padding:12, border:"1px dashed #d1d5db", borderRadius:12, background:"#f9fafb" };
const hintBox = { marginTop:12, padding:12, border:"1px solid #d1d5db", borderRadius:8, background:"#f3f4f6" };
const okBox = { marginTop:12, padding:12, border:"1px solid #bbf7d0", borderRadius:8, background:"#ecfdf5", color:"#065f46" };
const errBox = { marginTop:12, padding:12, border:"1px solid #fecaca", borderRadius:8, background:"#fef2f2", color:"#991b1b" };
const btnPrimary = { padding:"10px 14px", borderRadius:8, border:"none", background:"#2563eb", color:"#fff", fontWeight:600, cursor:"pointer" };
