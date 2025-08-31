import React from "react";

type Props = {
  value: { [k: string]: number };
  onChange: (v: any) => void;
};

const ITEMS = [
  { key: "psqi_c1", label: "Subjective sleep quality" },
  { key: "psqi_c2", label: "Sleep latency" },
  { key: "psqi_c3", label: "Sleep duration" },
  { key: "psqi_c4", label: "Habitual sleep efficiency" },
  { key: "psqi_c5", label: "Sleep disturbances" },
  { key: "psqi_c6", label: "Use of sleep medication" },
  { key: "psqi_c7", label: "Daytime dysfunction" },
];

export default function PSQIForm({ value, onChange }: Props) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>PSQI (0–3 each)</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {ITEMS.map((it) => (
          <label key={it.key} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>{it.label}</span>
            <select
              className="input"
              value={value?.[it.key] ?? 0}
              onChange={(e) => onChange({ ...value, [it.key]: Number(e.target.value) })}
            >
              {[0, 1, 2, 3].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
