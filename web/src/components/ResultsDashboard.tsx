import React from "react";

type Props = { results: any };

export default function ResultsDashboard({ results }: Props) {
  if (!results) return <div className="card">No results yet.</div>;
  const probs = results.probabilities || [0,0,0];
  return (
    <div className="card">
      <h2>Results</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12}}>
        <div className="card"><h3>Prediction</h3><div style={{fontSize:24}}>Class {results.prediction}</div></div>
        <div className="card"><h3>Confidence</h3><div style={{fontSize:24}}>{(results.label_confidence*100).toFixed(1)}%</div></div>
        <div className="card"><h3>Probabilities</h3>{probs.map((p:number,i:number)=>(<div key={i}>Class {i}: {(p*100).toFixed(1)}%</div>))}</div>
      </div>
      {results.explanation?.top5 && (
        <div style={{marginTop:12}}>
          <h3>Top Contributors (SHAP)</h3>
          <ul>{results.explanation.top5.map(([f,v]:[string,number])=>(<li key={f}><b>{f}</b>: {v.toFixed(3)}</li>))}</ul>
        </div>
      )}
    </div>
  );
}
