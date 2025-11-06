// web/src/components/PersonalInfoForm.jsx
import React, { useState } from "react";
import { uploadMedicalFileBase64, registerOrLogin, ensureAnonAuth } from "../lib/firebase";

export default function PersonalInfoForm({ onComplete }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    sleepQuality: 5,
    sleepDuration: 7,
    sleepIssues: [],
    medicalHistory: "",
  });

  const [authCreds, setAuthCreds] = useState({ email: "", password: "" });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const issueOpts = [
    "Insomnia",
    "Sleep Apnea",
    "Restless Leg Syndrome",
    "Narcolepsy",
    "Night Terrors",
    "Sleepwalking",
  ];

  function toggleIssue(issue) {
    setForm((s) => ({
      ...s,
      sleepIssues: s.sleepIssues.includes(issue)
        ? s.sleepIssues.filter((i) => i !== issue)
        : [...s.sleepIssues, issue],
    }));
  }
  function handleFileChange(e) {
    setFiles(Array.from(e.target.files || []));
  }

  function validate() {
    if (!form.name.trim()) return "Full Name is required.";
    if (String(form.age).trim() === "" || Number(form.age) <= 0) return "Age is required.";
    if (!form.gender) return "Gender is required.";
    if (form.sleepQuality === "" || isNaN(Number(form.sleepQuality))) return "Sleep Quality is required.";
    if (form.sleepDuration === "" || isNaN(Number(form.sleepDuration))) return "Average Sleep Duration is required.";
    return "";
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setBusy(true);
    try {
      // Sign in (email/pwd if provided) else anonymous
      let uid = null;
      if (authCreds.email && authCreds.password) {
        const u = await registerOrLogin(authCreds.email, authCreds.password);
        uid = u.uid;
      } else {
        const u = await ensureAnonAuth();
        uid = u.uid;
      }

      // Upload medical reports (Firestore Base64)
      const uploaded = [];
      for (const f of files) {
        // eslint-disable-next-line no-await-in-loop
        const res = await uploadMedicalFileBase64(f, f.name, uid);
        uploaded.push(res);
      }

      // Return collected info
      onComplete({
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        sleepQuality: Number(form.sleepQuality),
        sleepDuration: Number(form.sleepDuration),
        sleepIssues: form.sleepIssues,
        medicalHistory: form.medicalHistory || "",
        medicalFiles: uploaded, // [{id,name,mimeType,sizeBytes,chunked...}]
        userId: uid,
        email: authCreds.email || "",
        password: authCreds.password || "",
      });
    } catch (e2) {
      setErr(e2.message || "Failed to submit personal info");
    } finally {
      setBusy(false);
    }
  }

  const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 };
  const inp = { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, width: "100%" };
  const btnPrimary = {
    padding: "10px 14px",
    borderRadius: 8,
    background: busy ? "#94a3b8" : "#2563eb",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  };
  const label = { fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 };

  return (
    <div style={card}>
      <h2 style={{ margin: 0, marginBottom: 12 }}>👤 Personal Information</h2>

      {err && (
        <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#b91c1c", marginBottom: 12 }}>
          {err}
        </div>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <div>
          <div style={label}>Full Name *</div>
          <input
            required
            placeholder="Enter full name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            style={inp}
          />
        </div>

        <div>
          <div style={label}>Age *</div>
          <input
            required
            placeholder="Enter age"
            type="number"
            min="1"
            value={form.age}
            onChange={(e) => setForm((s) => ({ ...s, age: e.target.value }))}
            style={inp}
          />
        </div>

        <div>
          <div style={label}>Gender *</div>
          <select
            required
            value={form.gender}
            onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))}
            style={inp}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option><option value="female">Female</option>
            <option value="other">Other</option><option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <div style={label}>Sleep Quality (1–10) *</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              required
              type="range"
              min="1"
              max="10"
              value={form.sleepQuality}
              onChange={(e) => setForm((s) => ({ ...s, sleepQuality: Number(e.target.value) }))}
              style={{ flex: 1 }}
            />
            <div style={{ width: 40, textAlign: "center", fontWeight: 700 }}>{form.sleepQuality}</div>
          </div>
        </div>

        <div>
          <div style={label}>Average Sleep Duration (hours) *</div>
          <input
            required
            placeholder="e.g., 7.5"
            type="number"
            step="0.5"
            min="0"
            value={form.sleepDuration}
            onChange={(e) => setForm((s) => ({ ...s, sleepDuration: e.target.value }))}
            style={inp}
          />
        </div>

        <div>
          <div style={label}>Sleep Issues (optional)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {issueOpts.map((opt) => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={form.sleepIssues.includes(opt)}
                  onChange={() => toggleIssue(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div style={label}>Medical History (optional)</div>
          <textarea
            placeholder="Any relevant conditions, medications, etc."
            rows={3}
            value={form.medicalHistory}
            onChange={(e) => setForm((s) => ({ ...s, medicalHistory: e.target.value }))}
            style={inp}
          />
        </div>

        <div>
          <div style={label}>Upload Medical Reports (PDF only, optional)</div>
          <input type="file" accept=".pdf" multiple onChange={handleFileChange} />
          {files.length > 0 && (
            <div style={{ fontSize: 13, marginTop: 6, color: "#374151" }}>
              Selected: {files.map((f) => f.name).join(", ")}
            </div>
          )}
        </div>

        <div>
          <div style={label}>(Optional) Login / Register</div>
          <input
            type="email"
            placeholder="Email address"
            value={authCreds.email}
            onChange={(e) => setAuthCreds((s) => ({ ...s, email: e.target.value }))}
            style={inp}
          />
          <input
            type="password"
            placeholder="Password"
            value={authCreds.password}
            onChange={(e) => setAuthCreds((s) => ({ ...s, password: e.target.value }))}
            style={inp}
          />
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            If new, this will create your account automatically.
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <button type="submit" style={btnPrimary} disabled={busy}>
            {busy ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}

