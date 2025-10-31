// web/src/lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

const missing = Object.entries(firebaseConfig).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error(
    "[Firebase] Missing config keys:",
    missing.join(", "),
    "→ set them in Vercel → Project → Settings → Environment Variables."
  );
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function savePredictionRecord(payload) {
  const normalized = {
    createdAt: serverTimestamp(),
    personalInfo: payload?.personalInfo ?? null,
    rows: Array.isArray(payload?.rows) ? payload.rows.slice(0, 25) : null,
    apiResponse: payload?.apiResponse ?? null,
    clientMeta: {
      ua: (payload?.clientMeta?.ua || "").slice(0, 300),
      url: payload?.clientMeta?.url || "",
      ts: payload?.clientMeta?.ts || Date.now()
    }
  };
  try {
    const docRef = await addDoc(collection(db, "predictions"), normalized);
    return { ok: true, id: docRef.id };
  } catch (e) {
    // bubble up real error text
    const msg = (e && (e.message || String(e))) || "Firestore write failed";
    console.error("[Firebase] savePredictionRecord error:", msg);
    return { ok: false, error: msg };
  }
}
