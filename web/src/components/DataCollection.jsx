// web/src/components/DataCollection.jsx
import React, { useState } from "react";

export default function DataCollection({ onDataCollected }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleFileUpload = async (event) => {
    const f = event.target.files[0];
    if (!f) return;
    setFile(f);
    setError("");

    try {
      const text = await f.text();
      let parsed;

      if (f.name.endsWith(".json")) {
        parsed = JSON.parse(text);
      } else if (f.name.endsWith(".csv")) {
        parsed = text
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => line.split(","));
        // First row = header, rest = data
        const headers = parsed[0];
        parsed = parsed.slice(1).map((row) => {
          let obj = {};
          headers.forEach((h, i) => (obj[h.trim()] = row[i]?.trim()));
          return obj;
        });
      } else {
        throw new Error("Unsupported file format. Use CSV or JSON.");
      }

      // Pass parsed rows to parent (index.jsx -> predict)
      onDataCollected(parsed);
    } catch (e) {
      setError("Failed to parse file: " + e.message);
    }
  };

  return (
    <div className="border p-4 rounded bg-white">
      <h2 className="font-semibold text-lg mb-2">Upload Objective Data</h2>
      <input
        type="file"
        accept=".csv,.json"
        onChange={handleFileUpload}
        className="block border p-2"
      />
      {file && <p className="text-sm mt-2">Uploaded: {file.name}</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
