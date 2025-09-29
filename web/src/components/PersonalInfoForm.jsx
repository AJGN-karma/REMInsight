import React, { useState } from "react";

export default function PersonalInfoForm({ onComplete }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    medicalHistory: "",
    sleepQuality: "5",
    sleepDuration: "7",
    sleepIssues: []
  });
  const [saving, setSaving] = useState(false);

  const options = [
    "Insomnia",
    "Sleep Apnea",
    "Restless Leg Syndrome",
    "Narcolepsy",
    "Night Terrors",
    "Sleepwalking"
  ];

  const setField = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  const toggleIssue = (i) =>
    setFormData((p) => ({
      ...p,
      sleepIssues: p.sleepIssues.includes(i)
        ? p.sleepIssues.filter((x) => x !== i)
        : [...p.sleepIssues, i]
    }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // You can save to Firestore later — we just pass up the data now.
      onComplete(formData);
    } finally {
      setSaving(false);
    }
  };

  const card = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
  };

  const label = { display: "block", marginBottom: 6, fontSize: 14, color: "#374151" };
  const input = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    outline: "none"
  };

  return (
    <div style={card}>
      <h2 style={{ margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700 }}>
        📋 Personal Information
      </h2>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label style={label}>Full Name</label>
            <input
              style={input}
              value={formData.name}
              onChange={(e) => setField("name", e.target.value)}
              required
              placeholder="Your name"
            />
          </div>
          <div>
            <label style={label}>Age</label>
            <input
              style={input}
              type="number"
              min="1"
              max="120"
              value={formData.age}
              onChange={(e) => setField("age", e.target.value)}
              required
              placeholder="28"
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={label}>Gender</label>
          <select
            style={input}
            value={formData.gender}
            onChange={(e) => setField("gender", e.target.value)}
            required
          >
            <option value="">Select gender</option>
            <option>male</option>
            <option>female</option>
            <option>other</option>
            <option>prefer-not-to-say</option>
          </select>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={label}>Medical History</label>
          <textarea
            style={{ ...input, resize: "vertical", minHeight: 80 }}
            value={formData.medicalHistory}
            onChange={(e) => setField("medicalHistory", e.target.value)}
            placeholder="Conditions, medications, sleep issues…"
          />
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr", marginTop: 16 }}>
          <div>
            <label style={label}>Sleep Quality (1-10)</label>
            <input
              style={{ width: "100%" }}
              type="range"
              min="1"
              max="10"
              value={formData.sleepQuality}
              onChange={(e) => setField("sleepQuality", e.target.value)}
            />
            <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
              {formData.sleepQuality}/10
            </div>
          </div>
          <div>
            <label style={label}>Avg Sleep Duration (hours)</label>
            <input
              style={input}
              type="number"
              min="1"
              max="12"
              step="0.5"
              value={formData.sleepDuration}
              onChange={(e) => setField("sleepDuration", e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={label}>Sleep Issues</label>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr" }}>
            {options.map((issue) => (
              <label key={issue} style={{ fontSize: 14, color: "#374151" }}>
                <input
                  type="checkbox"
                  checked={formData.sleepIssues.includes(issue)}
                  onChange={() => toggleIssue(issue)}
                  style={{ marginRight: 8 }}
                />
                {issue}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: 16,
            width: "100%",
            background: "#2563eb",
            color: "#fff",
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          {saving ? "Saving..." : "Save & Continue"}
        </button>
      </form>
    </div>
  );
}
