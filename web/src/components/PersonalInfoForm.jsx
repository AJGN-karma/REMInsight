// web/src/components/PersonalInfoForm.jsx
import React, { useState } from "react";

export default function PersonalInfoForm({ onComplete }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    sleepQuality: 5,   // keep as number
    sleepDuration: 7,  // keep as number (hours)
    sleepIssues: [],
    medicalHistory: ""
  });

  const sleepIssueOptions = [
    "Insomnia", "Sleep Apnea", "Restless Leg Syndrome",
    "Narcolepsy", "Night Terrors", "Sleepwalking"
  ];

  function toggleIssue(issue) {
    setForm((p) => ({
      ...p,
      sleepIssues: p.sleepIssues.includes(issue)
        ? p.sleepIssues.filter(i => i !== issue)
        : [...p.sleepIssues, issue]
    }));
  }

  function submit(e) {
    e.preventDefault();
    onComplete({
      ...form,
      age: Number(form.age || 0),
      sleepQuality: Number(form.sleepQuality || 0),
      sleepDuration: Number(form.sleepDuration || 0),
    });
  }

  const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 };
  const inp = { padding:"10px 12px", border:"1px solid #d1d5db", borderRadius:8, width:"100%" };
  const btnPrimary = { padding:"10px 14px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer" };
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
              type="range"
              min="1"
              max="10"
              value={form.sleepQuality}
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
            placeholder="e.g., 7.5"
            type="number"
            step="0.5"
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
          <textarea placeholder="Any relevant conditions, medications, etc." rows={3}
            value={form.medicalHistory}
            onChange={e=>setForm(s=>({...s, medicalHistory:e.target.value}))}
            style={inp}/>
        </div>

        <div>
          <div style={label}>Sleep Issues</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap: 8 }}>
            {sleepIssueOptions.map(issue=>(
              <label key={issue} style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                <input
                  type="checkbox"
                  checked={form.sleepIssues.includes(issue)}
                  onChange={()=>toggleIssue(issue)}
                />
                {issue}
              </label>
            ))}
          </div>
        </div>

        <div style={{ textAlign:"right" }}>
          <button type="submit" style={btnPrimary}>Save & Continue</button>
        </div>
      </form>
    </div>
  );
}
