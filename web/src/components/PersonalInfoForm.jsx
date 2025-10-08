import React, { useState } from "react";

export default function PersonalInfoForm({ onComplete }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: ""
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit(e) {
    e.preventDefault();
    onComplete(form);
  }

  return (
    <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>👤 Personal Information</h2>

      <div style={{ display: "grid", gap: 12 }}>
        <label>
          <div style={{ fontSize: 14, marginBottom: 4 }}>Full Name</div>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Your name"
            required
            style={{ width: "100%", padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }}
          />
        </label>

        <label>
          <div style={{ fontSize: 14, marginBottom: 4 }}>Age</div>
          <input
            type="number"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
            placeholder="e.g. 30"
            style={{ width: "100%", padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }}
          />
        </label>

        <label>
          <div style={{ fontSize: 14, marginBottom: 4 }}>Gender</div>
          <select
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            style={{ width: "100%", padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }}
          >
            <option value="">Select…</option>
            <option>male</option>
            <option>female</option>
            <option>other</option>
            <option>prefer-not-to-say</option>
          </select>
        </label>
      </div>

      <div style={{ marginTop: 16, textAlign: "right" }}>
        <button
          type="submit"
          style={{ padding: "8px 12px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
        >
          Continue →
        </button>
      </div>
    </form>
  );
}
