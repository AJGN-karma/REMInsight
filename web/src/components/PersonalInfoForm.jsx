// web/src/components/PersonalInfoForm.jsx
import React, { useState } from "react";
import {
  registerOrLogin,
  ensureAnonAuth,
  uploadMedicalFileBase64,
} from "../lib/firebase";

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

  const [auth, setAuth] = useState({ email: "", password: "" });
  const [uploadFiles, setUploadFiles] = useState([]); // File[]
  const [uploading, setUploading] = useState(false);

  const sleepIssueOptions = [
    "Insomnia", "Sleep Apnea", "Restless Leg Syndrome",
    "Narcolepsy", "Night Terrors", "Sleepwalking"
  ];

  function toggleIssue(issue) {
    setForm((prev) => ({
      ...prev,
      sleepIssues: prev.sleepIssues.includes(issue)
        ? prev.sleepIssues.filter(i => i !== issue)
        : [...prev.sleepIssues, issue]
    }));
  }

  function handleFileChange(e) {
    setUploadFiles(Array.from(e.target.files || []));
  }

  async function submit(e) {
    e.preventDefault();
    setUploading(true);
    try {
      // 1) Identify/create user
      let userId = "";
      if (auth.email && auth.password) {
        const u = await registerOrLogin(auth.email, auth.password);
        userId = u.uid;
      } else {
        const u = await ensureAnonAuth();
        userId = u.uid;
      }

      // 2) Upload PDFs to Firestore as Base64
      const uploadedReports = [];
      for (const file of uploadFiles) {
        let label = prompt(`Enter report name/description for "${file.name}"`);
        while (!label || !label.trim()) {
          label = prompt("⚠️ Report name is required. Please enter a valid description:");
        }
        // eslint-disable-next-line no-await-in-loop
        const meta = await uploadMedicalFileBase64(file, label.trim(), userId);
        uploadedReports.push(meta); // {id,name,mimeType,sizeBytes,chunked}
      }

      // 3) Pass to parent
      onComplete({
        ...form,
        age: Number(form.age || 0),
        sleepQuality: Number(form.sleepQuality || 0),
        sleepDuration: Number(form.sleepDuration || 0),
        medicalFiles: uploadedReports, // store references in predictions
        userId,
        email: auth.email || "",
      });
    } catch (err) {
      alert("Error while saving personal info: " + (err?.message || String(err)));
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 };
  const inp = { padding:"10px 12px", border:"1px solid #d1d5db", borderRadius:8, width:"100%" };
  const btnPrimary = {
    padding:"10px 14px", borderRadius:8,
    background: uploading ? "#94a3b8" : "#2563eb",
    color:"#fff", border:"none", cursor:"pointer"
  };
  const label = { fontSize:14, fontWeight:600, color:"#374151", marginBottom:6 };

  return (
    <div style={card}>
      <h2 style={{ margin: 0, marginBottom: 12 }}>👤 Personal Information</h2>

      <form onSubmit={submit} style={{ display:"grid", gap:12 }}>
        <div>
          <div style={label}>Full Name</div>
          <input placeholder="Enter full name" value={form.name}
            onChange={e=>setForm(s=>({...s, name:e.target.value}))}
            style={inp}/>
        </div>

        <div>
          <div style={label}>Age</div>
          <input placeholder="Enter age" type="number" value={form.age}
            onChange={e=>setForm(s=>({...s, age:e.target.value}))}
            style={inp}/>
        </div>

        <div>
          <div style={label}>Gender</div>
          <select value={form.gender} onChange={e=>setForm(s=>({...s, gender:e.target.value}))} style={inp}>
            <option value="">Select gender</option>
            <option value="male">Male</option><option value="female">Female</option>
            <option value="other">Other</option><option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <div style={label}>Sleep Quality (1–10)</div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <input
              type="range" min="1" max="10" value={form.sleepQuality}
              onChange={e=>setForm(s=>({...s, sleepQuality:Number(e.target.value)}))}
              style={{ flex:1 }}
            />
            <div style={{ width:40, textAlign:"center", fontWeight:700 }}>{form.sleepQuality}</div>
          </div>
          <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>
            Move the slider — current selection is <b>{form.sleepQuality}/10</b>.
          </div>
        </div>

        <div>
          <div style={label}>Average Sleep Duration (hours)</div>
          <input
            placeholder="e.g., 7.5" type="number" step="0.5"
            value={form.sleepDuration}
            onChange={e=>setForm(s=>({...s, sleepDuration:e.target.value}))}
            style={inp}
          />
          <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>
            Recommended: 7–9 hours for most adults.
          </div>
        </div>

        <div>
          <div style={label}>Medical History (optional)</div>
          <textarea
            placeholder="Any relevant conditions, medications, etc."
            rows={3}
            value={form.medicalHistory}
            onChange={e=>setForm(s=>({...s, medicalHistory:e.target.value}))}
            style={inp}
          />
        </div>

        {/* 📎 File Upload Section (PDFs) */}
        <div>
          <div style={label}>Upload Medical Reports (PDF)</div>
          <input type="file" accept="application/pdf" multiple onChange={handleFileChange}/>
          {uploadFiles.length > 0 && (
            <div style={{ fontSize:13, marginTop:6, color:"#374151" }}>
              Selected: {uploadFiles.map(f => f.name).join(", ")}
              <div style={{ fontSize:12, color:"#64748b" }}>
                Large PDFs are chunked automatically (Firestore limit ≈ 1 MB/doc).
              </div>
            </div>
          )}
        </div>

        {/* 🔐 Auth → real patient ID */}
        <div>
          <div style={label}>Login / Registration (for Patient ID)</div>
          <input placeholder="Email address" type="email"
            value={auth.email} onChange={e=>setAuth(s=>({...s, email:e.target.value}))}
            style={inp}/>
          <input placeholder="Password" type="password"
            value={auth.password} onChange={e=>setAuth(s=>({...s, password:e.target.value}))}
            style={inp}/>
          <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>
            If new, an account is created automatically; otherwise you’ll be logged in.
          </div>
        </div>

        <div style={{ textAlign:"right" }}>
          <button type="submit" style={btnPrimary} disabled={uploading}>
            {uploading ? "Uploading..." : "Save & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
