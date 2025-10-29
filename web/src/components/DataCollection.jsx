import React, { useState } from "react";

// Simple CSV parser (no extra dependency). Assumes header row + comma-separated.
// If you prefer PapaParse later, we can swap it in.
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h=>h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => {
      const val = cols[i];
      const asNum = Number(val);
      obj[h] = val === "" || Number.isNaN(asNum) ? val : asNum; // numeric if looks numeric
    });
    return obj;
  });
}

export default function DataCollection({ onDataCollected }) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const text = await f.text();
    let parsed = [];
    if (f.name.endsWith(".json")) {
      parsed = JSON.parse(text);
    } else if (f.name.endsWith(".csv")) {
      parsed = parseCSV(text);
    } else {
      alert("Please upload CSV or JSON with columns matching /features");
      return;
    }
    setRows(parsed);
  }

  function analyze() {
    if (!rows.length) {
      alert("Please upload a CSV/JSON first.");
      return;
    }
    // Send rows straight to parent → predict()
    onDataCollected(rows);
  }

  const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 };

  return (
    <div style={card}>
      <h2 style={{ margin: 0, marginBottom: 12 }}>📁 Upload Objective Data</h2>
      <p style={{ marginTop: 0, color:"#334155" }}>
        Upload **per-patient** CSV/JSON with columns that match the API <code>/features</code>.
        The backend will validate and warn if required features are missing.
      </p>

      <input type="file" accept=".csv,.json" onChange={handleFile} />
      {fileName && <div style={{ marginTop: 8, color:"#334155" }}>Loaded: {fileName} ({rows.length} row(s))</div>}

      <div style={{ marginTop: 12, textAlign:"right" }}>
        <button onClick={analyze} style={btnPrimary}>🧠 Analyze with AI</button>
      </div>
    </div>
  );
}

const btnPrimary = { padding:"10px 14px", borderRadius: 8, background:"#7c3aed", color:"#fff", border:"none", cursor:"pointer" };
