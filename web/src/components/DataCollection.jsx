// web/src/components/DataCollection.jsx
import React, { useEffect, useState } from "react";
import { getFeatures } from "../lib/api";

export default function DataCollection({ onDataCollected }) {
  const [features, setFeatures] = useState([]);
  const [missing, setMissing] = useState([]);
  const [unexpected, setUnexpected] = useState([]);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const f = await getFeatures(); // {features:[...]}
        const list = Array.isArray(f.features) ? f.features : [];
        setFeatures(list);
      } catch (e) {
        setErr(`Failed to load features: ${e.message}`);
      }
    })();
  }, []);

  function showTemplateCsv() {
    const header = features.join(",");
    const example = [
      // one example row with plausible values
      [
        29, 1, 2, 2, 1, 2, 1, 1, // age, psqi_c1..c7
        420, 90, 85, 21.4, 2.0,  // TST_min, REM_total_min, REM_latency_min, REM_pct, REM_density
        90.5, 8,                 // sleep_efficiency_pct, micro_arousals_count
        1.8, 2.5, 4.2, 5.1,      // mean_delta_pow..mean_beta_pow
        1.0, 0.0, 7,             // artifact_pct, percent_epochs_missing, psqi_global
        0.21, 0.20               // rem_to_tst_ratio, rem_latency_ratio
      ].join(","),
    ].join("\n");

    const blob = new Blob([header + "\n" + example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "reminsight_template.csv";
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }

  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error("CSV must have a header and at least one row.");

    const headerRaw = lines[0].split(",").map((h) => h.trim());
    const header = headerRaw.map(h => h.replace(/\uFEFF/g, "")); // remove BOM if present

    const items = lines.slice(1).map((ln) => ln.split(",").map((x) => x.trim()));

    const rawRows = items.map((vals) => {
      const obj = {};
      header.forEach((h, i) => (obj[h] = vals[i] ?? ""));
      return obj;
    });

    return { header, rawRows };
  }

  function coerceNumber(v) {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function normalizeRows(rawRows, header) {
    // Build rows matching EXACT features, fill missing with null, coerce numbers.
    const headerSet = new Set(header);
    const miss = features.filter((f) => !headerSet.has(f));
    const unexp = header.filter((h) => !features.includes(h));

    setMissing(miss);
    setUnexpected(unexp);

    // If any required feature missing, we can still send (your imputer handles NaN),
    // but it's better UX to require user to fix. We'll permit send, but show warning.
    const normalized = rawRows.map((r) => {
      const obj = {};
      features.forEach((f) => {
        const val = r[f];
        // numbers: most features are numeric—coerce to number (null => imputed)
        obj[f] = typeof val === "string" ? coerceNumber(val) : (val ?? null);
      });
      return obj;
    });

    // quick sanity: at least one non-null in first row
    const first = normalized[0] || {};
    const nonNull = Object.values(first).some((v) => v !== null && v !== undefined && v !== "");
    setOk(nonNull);

    return normalized;
  }

  async function handleFile(e) {
    setErr("");
    setRows([]);
    setMissing([]);
    setUnexpected([]);
    setOk(false);

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const text = new TextDecoder("utf-8").decode(buf);

      let parsedRows = [];
      let header = [];

      if (file.name.toLowerCase().endsWith(".json")) {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error("JSON must be an array of row objects.");
        if (data.length === 0) throw new Error("JSON has zero rows.");
        header = Object.keys(data[0]);
        parsedRows = data;
      } else if (file.name.toLowerCase().endsWith(".csv")) {
        const { header: h, rawRows } = parseCsv(text);
        header = h;
        parsedRows = rawRows;
      } else {
        throw new Error("Use .csv or .json files.");
      }

      // Normalization
      const normalized = normalizeRows(parsedRows, header);
      setRows(normalized);
    } catch (ex) {
      setErr(`Parse error: ${ex.message}`);
    } finally {
      e.target.value = "";
    }
  }

  async function sendToPredict() {
    setBusy(true);
    setErr("");
    try {
      await onDataCollected(rows); // parent will call predict()
    } catch (e) {
      // parent could throw; still show here
      setErr(e.message || "Failed to send prediction");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      <h3 style={{ margin: 0, marginBottom: 12, fontWeight: 700 }}>📁 Upload CSV / JSON</h3>

      {features.length > 0 ? (
        <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
          <b>Required columns ({features.length}):</b> {features.join(", ")}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
          Loading required feature list…
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input type="file" accept=".csv,.json" onChange={handleFile} />
        <button
          onClick={showTemplateCsv}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#f9fafb",
            cursor: "pointer"
          }}
        >
          ⬇️ Download template
        </button>
      </div>

      {missing.length > 0 && (
        <div style={{ marginTop: 8, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", borderRadius: 8, padding: 10 }}>
          <b>Missing required columns:</b> {missing.join(", ")}
        </div>
      )}

      {unexpected.length > 0 && (
        <div style={{ marginTop: 8, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", borderRadius: 8, padding: 10 }}>
          <b>Unexpected columns (ignored):</b> {unexpected.join(", ")}
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 13, color: "#374151" }}>
          <div><b>Preview:</b> {rows.length} rows ready for prediction.</div>
          <pre style={{ background: "#f3f4f6", padding: 8, borderRadius: 8, overflow: "auto", maxHeight: 160 }}>
{JSON.stringify(rows.slice(0, 2), null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button
          onClick={sendToPredict}
          disabled={!rows.length || !ok || busy}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            background: (!rows.length || !ok || busy) ? "#9ca3af" : "#2563eb",
            color: "#fff",
            cursor: (!rows.length || !ok || busy) ? "not-allowed" : "pointer",
            fontWeight: 600
          }}
        >
          {busy ? "Analyzing…" : "🧠 Analyze with AI"}
        </button>
      </div>

      {err && (
        <div style={{ marginTop: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 8, padding: 10 }}>
          {err}
        </div>
      )}
    </div>
  );
}
