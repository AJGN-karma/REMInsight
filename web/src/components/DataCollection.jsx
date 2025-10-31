// web/src/components/DataCollection.jsx
import React, { useState } from "react";

// Simple CSV parser (assumes commas, no quoted commas)
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
      obj[h] = val === "" || Number.isNaN(asNum) ? val : asNum;
    });
    return obj;
  });
}

export default function DataCollection({ onDataCollected, apiFeatures }) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [headerInfo, setHeaderInfo] = useState(null);

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const text = await f.text();

    let parsed = [];
    if (f.name.toLowerCase().endsWith(".json")) {
      parsed = JSON.parse(text);
    } else if (f.name.toLowerCase().endsWith(".csv")) {
      parsed = parseCSV(text);
    } else {
      alert("Please upload CSV or JSON with columns matching /features");
      return;
    }
    setRows(parsed);

    // header coverage (client-side sanity)
    if (parsed.length && Array.isArray(apiFeatures) && apiFeatures.length) {
      const headers = Object.keys(parsed[0] || {});
      const setH = new Set(headers.map(h => h.trim()));
      const setF = new Set(apiFeatures.map(h => h.trim()));
      let matches = 0;
      setH.forEach(h => { if (setF.has(h)) matches += 1; });
      setHeaderInfo({
        headers,
        coverage: headers.length ? (matches / headers.length) : 0,
        matched: matches,
        totalHeaders: headers.length
      });
      console.log("[DataCollection] header coverage", {
        headers, apiFeatures, matches, coverage: (matches/headers.length).toFixed(2)
      });
    } else {
      setHeaderInfo(null);
    }
  }

  function analyze() {
    if (!rows.length) {
      alert("Please upload a CSV/JSON first.");
      return;
    }
    onDataCollected(rows);
  }

  const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 };

  return (
    <div style={card}>
      <h2 style={{ margin: 0, marginBottom: 12 }}>📁 Upload Objective Data</h2>
      <p style={{ marginTop: 0, color:"#334155" }}>
        Upload <b>per-patient</b> CSV/JSON with columns that match the API <code>/features</code>.
      </p>

      <input type="file" accept=".csv,.json" onChange={handleFile} />
      {fileName && (
        <div style={{ marginTop: 8, color:"#334155" }}>
          Loaded: {fileName} ({rows.length} row{rows.length===1?"":"s"})
          {headerInfo && (
            <div style={{ fontSize:12, color:"#64748b" }}>
              Header match: {headerInfo.matched}/{headerInfo.totalHeaders} ({(headerInfo.coverage*100).toFixed(0)}%)
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 12, textAlign:"right" }}>
        <button onClick={analyze} style={btnPrimary}>🧠 Analyze with AI</button>
      </div>
    </div>
  );
}

const btnPrimary = { padding:"10px 14px", borderRadius: 8, background:"#7c3aed", color:"#fff", border:"none", cursor:"pointer" };
