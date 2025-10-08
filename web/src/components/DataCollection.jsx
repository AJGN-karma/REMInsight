import React, { useState } from "react";

export default function DataCollection({ modelFeatures = [], onDataCollected }) {
  const [rows, setRows] = useState([]);
  const [fileErr, setFileErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  function coerceValue(v) {
    if (v === "" || v === null || typeof v === "undefined") return null;
    // try numeric
    const n = Number(v);
    if (!Number.isNaN(n) && v !== true && v !== false) return n;
    // leave strings/booleans as-is (if your model expects only numbers,
    // put 0/1 in your CSV columns for categorical one-hots).
    return v;
  }

  function normalize(rawRows, features) {
    return rawRows.map((r) => {
      const out = {};
      for (const f of features) {
        out[f] = coerceValue(r[f]);
      }
      return out;
    });
  }

  async function handleFile(file) {
    setFileErr("");
    setInfoMsg("");
    try {
      const text = await file.text();
      let rawRows;

      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(text);
        rawRows = Array.isArray(parsed) ? parsed : parsed.rows || [];
      } else if (file.name.toLowerCase().endsWith(".csv")) {
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) throw new Error("CSV must have a header and at least one row.");
        const headers = lines[0].split(",").map((h) => h.trim());
        rawRows = lines.slice(1).map((line) => {
          const cols = line.split(",");
          const obj = {};
          headers.forEach((h, i) => (obj[h] = cols[i] ?? null));
          return obj;
        });
      } else {
        throw new Error("Use .csv or .json");
      }

      if (!Array.isArray(rawRows) || rawRows.length === 0) {
        throw new Error("No rows found.");
      }

      // Check columns
      const rawKeys = Object.keys(rawRows[0] || {});
      const missing = modelFeatures.filter((k) => !rawKeys.includes(k));
      const extra = rawKeys.filter((k) => !modelFeatures.includes(k));

      if (missing.length > 0) {
        setInfoMsg(`Missing columns (sent as null): ${missing.join(", ")}`);
      } else if (extra.length > 0) {
        setInfoMsg(`Ignoring extra columns: ${extra.join(", ")}`);
      } else {
        setInfoMsg(`All columns match the model.`);
      }

      const aligned = normalize(rawRows, modelFeatures);
      setRows(aligned);
    } catch (e) {
      console.error(e);
      setRows([]);
      setFileErr(e.message || "Failed to parse file");
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>📁 File Upload</h2>

      <input
        type="file"
        accept=".csv,.json"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {fileErr && <div style={{ color: "#b91c1c", marginTop: 8 }}>{fileErr}</div>}
      {infoMsg && <div style={{ color: "#374151", marginTop: 8, fontSize: 13 }}>{infoMsg}</div>}

      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => onDataCollected(rows)}
          disabled={rows.length === 0}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            background: rows.length === 0 ? "#9ca3af" : "#2563eb",
            color: "#fff",
            border: "none",
            cursor: rows.length === 0 ? "not-allowed" : "pointer",
            fontWeight: 600
          }}
        >
          Analyze with AI Model
        </button>
      </div>

      {rows.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 13, color: "#4b5563" }}>
          Ready to send {rows.length} row(s).
        </div>
      )}
    </div>
  );
}
