import React, { useState } from "react";

export default function PersonalInfoForm({ onComplete }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    sleepQuality: "",
    sleepDuration: "",
    sleepIssues: [],
    medicalHistory: ""
  });

  const issues = ["Insomnia","Sleep Apnea","RLS","Narcolepsy","Night Terrors","Sleepwalking"];

  const update = (k,v)=> setForm(s=>({...s,[k]:v}));
  const toggleIssue = (it)=>
    setForm(s=>({...s, sleepIssues: s.sleepIssues.includes(it) ? s.sleepIssues.filter(x=>x!==it) : [...s.sleepIssues, it]}));

  return (
    <div style={card}>
      <h2 style={h2}>👤 Personal Information</h2>

      <div style={grid2}>
        <Input label="Full Name" value={form.name} onChange={e=>update("name", e.target.value)} />
        <Input label="Age" type="number" value={form.age} onChange={e=>update("age", e.target.value)} />
      </div>

      <div style={{marginTop:12}}>
        <label style={label}>Gender</label>
        <select value={form.gender} onChange={e=>update("gender", e.target.value)} style={input}>
          <option value="">Select gender</option>
          <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
        </select>
      </div>

      <div style={grid2}>
        <Input label="Sleep Quality (1-10)" type="number" value={form.sleepQuality} onChange={e=>update("sleepQuality", e.target.value)} />
        <Input label="Avg Sleep Duration (h)" type="number" step="0.5" value={form.sleepDuration} onChange={e=>update("sleepDuration", e.target.value)} />
      </div>

      <div style={{marginTop:12}}>
        <label style={label}>Sleep Issues</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {issues.map(it=>(
            <label key={it} style={chipLabel}>
              <input type="checkbox" checked={form.sleepIssues.includes(it)} onChange={()=>toggleIssue(it)} />
              <span>{it}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{marginTop:12}}>
        <label style={label}>Medical History</label>
        <textarea rows={4} value={form.medicalHistory} onChange={e=>update("medicalHistory", e.target.value)} style={textarea} />
      </div>

      <div style={{marginTop:16, textAlign:"right"}}>
        <button onClick={()=>onComplete(form)} style={btnPrimary}>Save & Continue →</button>
      </div>
    </div>
  );
}

const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 };
const h2 = { margin:0, marginBottom:12, fontSize:20, fontWeight:700 };
const grid2 = { display:"grid", gap:12, gridTemplateColumns:"1fr 1fr" };
const label = { display:"block", fontSize:12, color:"#374151", marginBottom:6 };
const input = { width:"100%", padding:"10px 12px", border:"1px solid #d1d5db", borderRadius:8 };
const textarea = { width:"100%", padding:"10px 12px", border:"1px solid #d1d5db", borderRadius:8 };
const chipLabel = { display:"inline-flex", gap:6, alignItems:"center", padding:"6px 10px", border:"1px solid #d1d5db", borderRadius:9999, background:"#f9fafb" };
const btnPrimary = { padding:"10px 14px", borderRadius:8, border:"none", background:"#2563eb", color:"#fff", fontWeight:600, cursor:"pointer" };
function Input({label:lab, ...rest}){ return (<div><label style={label}>{lab}</label><input style={input} {...rest}/></div>) }
