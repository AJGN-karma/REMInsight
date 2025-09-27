import React from "react";
import DataCollection from "../src/components/DataCollection";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "Arial, sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>REMInsight – Psychiatric Risk Prediction</h1>
      <p style={{ marginBottom: "1.5rem", color: "#444" }}>
        Enter your sleep and PSQI features. We’ll send them to the model running on Render
        and show the predicted risk and class probabilities.
      </p>
      <DataCollection />
    </main>
  );
}
