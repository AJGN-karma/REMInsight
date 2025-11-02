// web/src/lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit as qLimit,
  serverTimestamp
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ---------- writes ----------
export async function savePredictionRecord(payload) {
  try {
    const col = collection(db, "predictions");
    const docRef = await addDoc(col, { ...payload, createdAt: serverTimestamp() });
    return { ok: true, id: docRef.id };
  } catch (e) {
    console.error("[Firestore] save failed:", e);
    return { ok: false, error: String(e) };
  }
}

// ---------- reads ----------
export async function listPredictions(limitCount = 100) {
  const col = collection(db, "predictions");
  const q = query(col, orderBy("createdAt", "desc"), qLimit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
    return { id: d.id, ...data, createdAtDate: ts, createdAtISO: ts ? ts.toISOString() : "" };
  });
}

export async function getPredictionById(id) {
  const ref = doc(db, "predictions", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
  return { id: snap.id, ...data, createdAtDate: ts, createdAtISO: ts ? ts.toISOString() : "" };
}

// ---------- CSV export (client-side download) ----------
export function exportArrayToCSV(filename, rows, headerOrder) {
  if (!rows?.length) return;
  const headers = headerOrder || Object.keys(rows[0]);
  const esc = (v) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(",")]
    .concat(rows.map(r => headers.map(h => esc(r[h])).join(",")))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Build a compact row for export
export function normalizeDocForCSV(doc) {
  const firstRow = Array.isArray(doc.rows) && doc.rows.length ? doc.rows[0] : {};
  const firstRes = doc.apiResponse?.results?.[0] || {};
  const probs = firstRes.probs || [];
  return {
    id: doc.id,
    createdAt: doc.createdAtISO || "",
    name: doc.personalInfo?.name || "",
    age: doc.personalInfo?.age ?? "",
    gender: doc.personalInfo?.gender || "",
    psqi_global: firstRow.psqi_global ?? "",
    rem_total_min: firstRow.REM_total_min ?? "",
    rem_latency_min: firstRow.REM_latency_min ?? "",
    rem_pct: firstRow.REM_pct ?? "",
    pred_risk: firstRes.pred_risk ?? "",
    prob_low: probs[0] ?? "",
    prob_moderate: probs[1] ?? "",
    prob_high: probs[2] ?? ""
  };
}
