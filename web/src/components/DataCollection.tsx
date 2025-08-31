import React, { useState } from "react";
import { predict } from "../api";
import { getIdTokenOrNull } from "../auth";

type Props = {
  personal: any;
  onResults: (res: any) => void;
};

export default function DataCollection({ personal, onResults }: Props) {
  const [derived, setDerived] = useState<any>({
    TST_min: 420, REM_total_min: 90, REM_latency_min: 80, REM_pct: 0.22, REM_density: 0.18,
    sleep_efficiency_pct: 0.92, micro_arousals_count: 14,
    mean_delta_pow: 1.1, mean_theta_pow: 0.7, mean_alpha_pow: 0.5, mean_beta_pow: 0.3,
    artifact_pct: 2.0, percent_epochs_missing: 0.0
  });
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const features = {
        recording_id: `rec_${Date.now()}`,
        subject_id: `sub_${(personal.name || 'anon').replace(/\s+/g,'_')}`,
        age: personal.age, sex: personal.sex, site: personal.site, device_model: personal.device_model,
        psqi_c1: personal.psqi_c1, psqi_c2: personal.psqi_c2, psqi_c3: personal.psqi_c3, psqi_c4: personal.psqi_c4,
        psqi_c5: personal.psqi_c5, psqi_c6: personal.psqi_c6, psqi_c7: personal.psqi_c7, psqi_global: personal.psqi_global,
        ...derived
      };
      const token = await getIdTokenOrNull();
      const res = await predict(features, true, token || undefined);
      onResults(res);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2>Data Collection (night-level features)</h2>
      <p>For uploads & raw signals, use backend <code>/extract_and_predict</code> later. This path uses edited night-level inputs.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
        {Object.keys(derived).map((k)=>(
          <label key={k}>{k}
            <input className="input" value={derived[k]} onChange={e=>setDerived({...derived,[k]: Number(e.target.value)})}/>
          </label>
        ))}
      </div>
      <div style={{marginTop:12}}>
        <button className="button" onClick={run} disabled={busy}>{busy ? "Analyzing..." : "Analyze with AI"}</button>
      </div>
    </div>
  );
}
