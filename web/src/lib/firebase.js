// web/src/lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let db = null;

try {
  const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId;
  if (!hasConfig) {
    console.warn("[Firebase] Missing config keys: apiKey/projectId/appId");
  } else {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (err) {
  console.error("[Firebase] Init failed:", err);
}

export { db };

/** Save one analysis record */
export async function savePredictionRecord(payload) {
  if (!db) return { ok: false, error: "Firebase not configured" };
  try {
    const ref = await addDoc(collection(db, "predictions"), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return { ok: true, id: ref.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Fetch all predictions (no auth filter for now) */
export async function listPredictions() {
  if (!db) throw new Error("Firebase not configured");
  const snap = await getDocs(collection(db, "predictions"));
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  // sort by createdAt desc (client-side)
  return rows.sort((a, b) => {
    const ta = a.createdAt?.seconds || 0;
    const tb = b.createdAt?.seconds || 0;
    return tb - ta;
  });
}

/** Get one prediction by Firestore doc id */
export async function getPredictionById(id) {
  if (!db) throw new Error("Firebase not configured");
  const d = await getDoc(doc(db, "predictions", id));
  if (!d.exists()) throw new Error("Not found");
  return { id: d.id, ...d.data() };
}
