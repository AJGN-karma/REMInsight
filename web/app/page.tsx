"use client";
import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://reminsight.onrender.com";

export default function Home() {
  const [status, setStatus] = useState("Checking backend…");
  const [api, setApi] = useState(API_BASE);

  useEffect(() => {
    const url = `${api}/health`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json().catch(() => ({}));
      })
      .then(() => setStatus("Backend OK ✅"))
      .catch((e) => setStatus(`Backend not reachable ❌ (${e.message})`));
  }, [api]);

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold">🧠 REMInsight</h1>
      <p className="mt-2 text-gray-600">API Base: {api}</p>
      <p className="mt-2">{status}</p>

      <div className="mt-6 flex gap-4">
        <a
          className="underline text-blue-600"
          href={`${api}/docs`}
          target="_blank"
          rel="noreferrer"
        >
          Open API docs (Swagger)
        </a>
        <a
          className="underline text-blue-600"
          href="/api/health"
          target="_blank"
          rel="noreferrer"
          title="This goes through Vercel rewrite to Render"
        >
          Test via /api/health (rewrite)
        </a>
      </div>
    </main>
  );
}
