import React, { useEffect, useRef, useState } from "react";

export default function DataCollection({ onDataCollected }) {
  const [tab, setTab] = useState("device");
  const [isStreaming, setIsStreaming] = useState(false);
  const [points, setPoints] = useState([]);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);

  const card = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const start = () => {
    setIsStreaming(true);
    setPoints([]);
    timer.current = setInterval(() => {
      const t = Date.now();
      const eeg = Math.sin(t / 1000) * 50 + Math.random() * 20;
      const eog = Math.cos(t / 800) * 30 + Math.random() * 15;
      setPoints((p) => [...p.slice(-99), { t, eeg, eog }]);
    }, 100);
  };

  const stop = () => {
    setIsStreaming(false);
    if (timer.current) clearInterval(timer.current);
  };

  const chooseFile = (e) => setFile(e.target.files?.[0] || null);

  const analyze = async () => {
    setBusy(true);
    try {
      // This just mimics device/file analysis output used by the Results view.
      const mock = {
        sleepStages: ["Wake", "N1", "N2", "N3", "REM", "N2", "N3", "REM"],
        remPercentage: 23.5,
        sleepEfficiency: 87.2,
        totalSleepTime: 7.5,
        remLatency: 85,
        hypnogram: Array.from({ length: 480 }, (_, i) => {
          const pos = i % 90;
          if (pos < 20) return "Wake";
          if (pos < 35) return "N1";
          if (pos < 55) return "N2";
          if (pos < 75) return "N3";
          return "REM";
        }),
        remMaps: {
          density: Array.from({ length: 100 }, () => Math.random()),
          frequency: Array.from({ length: 100 }, () => Math.random() * 30 + 1)
        }
      };
      onDataCollected(mock);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={card}>
      <h2 style={{ margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700 }}>
        📊 Data Collection
      </h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["device", "upload"].map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: tab === k ? "#fff" : "#f3f4f6",
              cursor: "pointer"
            }}
          >
            {k === "device" ? "🔗 Device Streaming" : "📁 File Upload"}
          </button>
        ))}
      </div>

      {/* Device */}
      {tab === "device" && (
        <>
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              EEG/EOG Device Connection
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={start}
                disabled={isStreaming}
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer"
                }}
              >
                {isStreaming ? "🟢 Streaming..." : "▶️ Start Streaming"}
              </button>
              <button
                onClick={stop}
                disabled={!isStreaming}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer"
                }}
              >
                ⏹️ Stop
              </button>
            </div>
          </div>

          {points.length > 0 && (
            <div
              style={{
                background: "#111827",
                borderRadius: 8,
                height: 140,
                position: "relative",
                overflow: "hidden"
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="0.8"
                  points={points
                    .map(
                      (p, i) =>
                        `${(i / points.length) * 100},${50 - (p.eeg / 100) * 40}`
                    )
                    .join(" ")}
                />
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="0.8"
                  points={points
                    .map(
                      (p, i) =>
                        `${(i / points.length) * 100},${70 - (p.eog / 100) * 40}`
                    )
                    .join(" ")}
                />
              </svg>
            </div>
          )}
        </>
      )}

      {/* Upload */}
      {tab === "upload" && (
        <div
          style={{
            border: "2px dashed #d1d5db",
            borderRadius: 12,
            padding: 24,
            textAlign: "center"
          }}
        >
          <p style={{ marginTop: 0, marginBottom: 8 }}>
            Upload CSV / JSON / Excel (demo accepts any file).
          </p>
          <input type="file" onChange={chooseFile} />
          {file && (
            <div style={{ marginTop: 8, fontSize: 14, color: "#065f46" }}>
              ✅ {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>
      )}

      <button
        onClick={analyze}
        disabled={busy || (tab === "device" && points.length === 0) || (tab === "upload" && !file)}
        style={{
          marginTop: 16,
          width: "100%",
          background: "#7c3aed",
          color: "#fff",
          padding: "10px 12px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontWeight: 600
        }}
      >
        {busy ? "🔄 Analyzing..." : "🧠 Analyze with AI Model"}
      </button>

      {tab === "device" && points.length === 0 && !busy && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", textAlign: "center" }}>
          Start streaming to collect data for analysis
        </div>
      )}
      {tab === "upload" && !file && !busy && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", textAlign: "center" }}>
          Upload a file to proceed
        </div>
      )}
    </div>
  );
}
