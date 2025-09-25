
import React from "react";
import DataCollection from "../src/components/DataCollection";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>REMInsight – Psychiatric Risk Prediction</h1>
      <p>Provide your sleep and PSQI features to predict psychiatric risk.</p>
      <DataCollection />
    </main>
  );
}
