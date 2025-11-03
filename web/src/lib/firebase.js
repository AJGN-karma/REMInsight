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
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";

// ---------- CONFIG ----------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// ---------- INIT ----------
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// ===============================================================
// 🔐 AUTH HELPERS
// ===============================================================
export async function registerOrLogin(email, password) {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    return userCred.user;
  } catch {
    const newUser = await createUserWithEmailAndPassword(auth, email, password);
    return newUser.user;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

// ===============================================================
// 📤 FILE UPLOAD (PDF REPORTS)
// ===============================================================
export async function uploadMedicalFile(file, label, userId) {
  const path = `medical_reports/${userId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { name: label, url };
}

// ===============================================================
// 🩺 SAVE PREDICTION RECORD
// ===============================================================
export async function savePredictionRecord(userId, payload) {
  try {
    // Store each prediction under that user's document
    const userRef = doc(db, "users", userId);
    const predCol = collection(userRef, "predictions");
    const docRef = await addDoc(predCol, {
      ...payload,
      createdAt: serverTimestamp()
    });
    return { ok: true, id: docRef.id };
  } catch (e) {
    console.error("[Firestore] save failed:", e);
    return { ok: false, error: String(e) };
  }
}

// ===============================================================
// 📊 ADMIN & PATIENT READS
// ===============================================================

// 1. Admin: get all users’ predictions
export async function listAllPredictions(limitCount = 200) {
  const col = collectionGroup(db, "predictions");
  const q = query(col, orderBy("createdAt", "desc"), qLimit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
    return { id: d.id, ...data, createdAtISO: ts ? ts.toISOString() : "" };
  });
}

// 2. Patient: get predictions by their user ID
export async function listPredictionsByUser(userId, limitCount = 50) {
  const userRef = doc(db, "users", userId);
  const predCol = collection(userRef, "predictions");
  const q = query(predCol, orderBy("createdAt", "desc"), qLimit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
    return { id: d.id, ...data, createdAtISO: ts ? ts.toISOString() : "" };
  });
}

// 3. Single record fetch
export async function getPredictionById(userId, recordId) {
  const ref = doc(db, "users", userId, "predictions", recordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
  return { id: snap.id, ...data, createdAtISO: ts ? ts.toISOString() : "" };
}

// ===============================================================
// 📥 CSV EXPORT (client-side download)
// ===============================================================
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

// Compact export row
export function normalizeDocForCSV(doc) {
  const firstRow = Array.isArray(doc.rows) && doc.rows.length ? doc.rows[0] : {};
  const firstRes = doc.apiResponse?.results?.[0] || {};
  const probs = firstRes.probs || [];
  return {
    id: doc.id,
    createdAt: doc.createdAtISO || "",
    userId: doc.personalInfo?.userId || "",
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
