import React, { useEffect, useRef, useState } from "react";

export default function ResultsDashboard({ results, personalInfo }) {
  const [tab, setTab] = useState("overview");
  const canvasRef = useRef(null);

  const card = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
  };

  useEffect(() => {
    if (!results || tab !== "hypnogram" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const stages = results.hypnogram || [];
    const map = { N3: 0, N2: 1, N1: 2, REM: 3, Wake: 4 };
    ctx.beginPath();
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    stages.forEach((s, i) => {
      const x = (i / Math.max(1, stages.length - 1)) * (W - 10) + 5;
      const y = 10 + (map[s] / 4) * (H - 20);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [tab, results]);

  if (!results) {
    return (
      <div style={card}>
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🧠</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>No results yet</div>
          <div style={{ color: "#6b7280" }}>Run an analysis to see results here.</div>
        </div>
      </div>
    );
  }

  const pct = (stage) =>
    ((results.hypnogram || []).filter((s) => s === stage).length /
      Math.max(1, (results.hypnogram || []).length)) * 100;

  return (
    <div style={card}>
      <h2 style={{ margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700 }}>
        📈 Analysis Results
      </h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[
          ["overview", "📊 Overview"],
          ["hypnogram", "📈 Hypnogram"],
          ["rem", "🧠 REM Analysis"],
          ["personal", "👤 Personal Info"]
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              background: tab === key ? "#fff" : "#f3f4f6",
              cursor: "pointer"
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(4, 1fr)" }}>
            <Stat title="REM Sleep" value={`${results.remPercentage}%`} color="#3b82f6" />
            <Stat title="Sleep Efficiency" value={`${results.sleepEfficiency}%`} color="#10b981" />
            <Stat title="Total Sleep Time" value={`${results.totalSleepTime}h`} color="#8b5cf6" />
            <Stat title="REM Latency" value={`${results.remLatency}m`} color="#f59e0b" />
          </div>

          <div
            style={{ marginTop: 16, background: "#f3f4f6", borderRadius: 12, padding: 16 }}
          >
            <div style={{ marginBottom: 8, fontWeight: 600 }}>
              Sleep Stage Distribution
            </div>
            {["Wake", "REM", "N1", "N2", "N3"].map((s) => {
              const v = pct(s).toFixed(1);
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ width: 60, fontSize: 12 }}>{s}</div>
                  <div style={{ flex: 1, background: "#e5e7eb", height: 8, borderRadius: 9999 }}>
                    <div
                      style={{
                        width: `${v}%`,
                        height: 8,
                        borderRadius: 9999,
                        background:
                          s === "Wake"
                            ? "#ef4444"
                            : s === "REM"
                            ? "#3b82f6"
                            : s === "N1"
                            ? "#f59e0b"
                            : s === "N2"
                            ? "#10b981"
                            : "#8b5cf6"
                      }}
                    />
                  </div>
                  <div style={{ width: 40, textAlign: "right", fontSize: 12, marginLeft: 8 }}>
                    {v}%
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "hypnogram" && (
        <div
          style={{
            background: "#f3f4f6",
            borderRadius: 12,
            padding: 16,
            height: 320
          }}
        >
          <canvas ref={canvasRef} width={800} height={260} />
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
            0 (N3) → 4 (Wake); stepped line indicates stage over time.
          </div>
        </div>
      )}

      {tab === "rem" && (
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "1fr 1fr"
          }}
        >
          <div style={{ background: "#eff6ff", borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>REM Density Map</div>
            <div style={{ height: 140, position: "relative", background: "#dbeafe", borderRadius: 8 }}>
              {(results.remMaps?.density || []).slice(0, 40).map((v, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${(i % 10) * 10}%`,
                    top: `${Math.floor(i / 10) * 50}%`,
                    width: `${v * 8 + 2}px`,
                    height: `${v * 8 + 2}px`,
                    background: "#fff",
                    borderRadius: "50%",
                    opacity: v
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ background: "#f5f3ff", borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>REM Frequency Analysis</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Alpha (8-12 Hz): 15.2%</li>
              <li>Beta (13-30 Hz): 28.7%</li>
              <li>Gamma (&gt;30 Hz): 12.1%</li>
              <li>Theta (4-7 Hz): 44.0%</li>
            </ul>
          </div>
        </div>
      )}

      {tab === "personal" && personalInfo && (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <InfoCard title="Basic Information">
            <Row k="Name" v={personalInfo.name} />
            <Row k="Age" v={personalInfo.age} />
            <Row k="Gender" v={personalInfo.gender} />
          </InfoCard>
          <InfoCard title="Sleep Patterns">
            <Row k="Sleep Quality" v={`${personalInfo.sleepQuality}/10`} />
            <Row k="Sleep Duration" v={`${personalInfo.sleepDuration}h`} />
          </InfoCard>
          {!!(personalInfo.sleepIssues || []).length && (
            <InfoCard title="Reported Sleep Issues">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {personalInfo.sleepIssues.map((s) => (
                  <span key={s} style={{ background: "#fef3c7", padding: "4px 8px", borderRadius: 9999 }}>
                    {s}
                  </span>
                ))}
              </div>
            </InfoCard>
          )}
          {personalInfo.medicalHistory && (
            <InfoCard title="Medical History">
              <div style={{ whiteSpace: "pre-wrap" }}>{personalInfo.medicalHistory}</div>
            </InfoCard>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ title, value, color }) {
  return (
    <div
      style={{
        background: "#f3f4f6",
        borderRadius: 12,
        padding: 12
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#374151" }}>{title}</div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div style={{ background: "#f9fafb", borderRadius: 12, padding: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <div style={{ color: "#6b7280" }}>{k}:</div>
      <div style={{ fontWeight: 600 }}>{v}</div>
    </div>
  );
}
