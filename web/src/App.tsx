import React, { useState } from "react";
import PersonalInfoForm from "./components/PersonalInfoForm";
import DataCollection from "./components/DataCollection";
import ResultsDashboard from "./components/ResultsDashboard";

export default function App() {
  const [personal, setPersonal] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const step = personal ? (results ? 3 : 2) : 1;

  return (
    <div style={{maxWidth:900, margin:"40px auto", padding:"0 16px"}}>
      <h1>REMInsight</h1>
      <div style={{display:"grid", gap:16}}>
        {step===1 && <PersonalInfoForm onComplete={setPersonal} />}
        {step===2 && <DataCollection personal={personal} onResults={setResults} />}
        {step===3 && <ResultsDashboard results={results} />}
      </div>
    </div>
  );
}
