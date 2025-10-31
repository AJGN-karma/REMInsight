// web/src/components/PersonalInfoForm.jsx
import React, { useState } from "react";

export default function PersonalInfoForm({ onComplete }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    sleepQuality: "5",
    sleepDuration: "7",
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
  const inp = { padding:"10px 12px", border:"1px solid #d1d5db", borderRadius:8 };
  const btnPrimary = { padding:"10px 14px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none", cursor:"pointer" };

  return (
    <div style={card}>
      <h2 style={{ margin: 0, marginBottom: 12 }}>👤 Personal Information</h2>
      <form onSubmit={submit} style={{ display:"grid", gap:12 }}>
        <input placeholder="Full name" value={form.name}
          onChange={e=>setForm(s=>({...s, name:e.target.value}))}
          style={inp}/>
        <input placeholder="Age" type="number" value={form.age}
          onChange={e=>setForm(s=>({...s, age:e.target.value}))}
          style={inp}/>
        <select value={form.gender} onChange={e=>setForm(s=>({...s, gender:e.target.value}))} style={inp}>
          <option value="">Select gender</option>
          <option value="male">Male</option><option value="female">Female</option>
          <option value="other">Other</option><option value="prefer-not-to-say">Prefer not to say</option>
        </select>
        <label>Sleep Quality (1-10)</label>
        <input type="range" min="1" max="10" value={form.sleepQuality}
          onChange={e=>setForm(s=>({...s, sleepQuality:e.target.value}))}/>
        <input placeholder="Average sleep duration (hours)" type="number" step="0.5" value={form.sleepDuration}
          onChange={e=>setForm(s=>({...s, sleepDuration:e.target.value}))}
          style={inp}/>
        <textarea placeholder="Medical history (optional)" rows={3}
          value={form.medicalHistory}
          onChange={e=>setForm(s=>({...s, medicalHistory:e.target.value}))}
          style={inp}/>
        <div>
          <div style={{ marginBottom: 6 }}>Sleep Issues</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap: 8 }}>
            {sleepIssueOptions.map(issue=>(
              <label key={issue} style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                <input type="checkbox"
                  checked={form.sleepIssues.includes(issue)}
                  onChange={()=>toggleIssue(issue)} />
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
