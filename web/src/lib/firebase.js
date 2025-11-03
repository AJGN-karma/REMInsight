// web/src/lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  collectionGroup,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  query,
  orderBy,
  limit as qLimit,
  serverTimestamp,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

/* ------------------------------------------------------------------ */
/* ENV + INIT                                                          */
/* ------------------------------------------------------------------ */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Helpful warning in build logs if something is missing
(function sanityCheckEnv() {
  const missing = Object.entries({
    NEXT_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
    NEXT_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
  })
    .filter(([_, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    // This only logs on the client; safe to show
    console.warn(
      "[Firebase] Missing config keys:",
      missing.join(", "),
      "→ set them in Vercel → Project → Settings → Environment Variables."
    );
  }
})();

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

/* ------------------------------------------------------------------ */
/* AUTH                                                                */
/* ------------------------------------------------------------------ */

/**
 * Try sign-in; if user doesn't exist, create account. Returns FirebaseUser.
 * Use this when PersonalInfo form provides email + password.
 */
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

/* ------------------------------------------------------------------ */
/* USER PROFILE (optional but useful)                                  */
/* ------------------------------------------------------------------ */

/**
 * Upsert a minimal public profile for a user.
 * Call after auth or when you have new personalInfo to persist.
 */
export async function upsertUserProfile(userId, profile) {
  const userRef = doc(db, "users", userId);
  await setDoc(
    userRef,
    {
      profile: {
        ...(profile || {}),
        updatedAt: serverTimestamp(),
      },
      // Ensure a createdAt exists
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/* ------------------------------------------------------------------ */
/* STORAGE (Medical PDFs)                                              */
/* ------------------------------------------------------------------ */

/**
 * Upload ONE medical file (PDF or any file) and return {name, url}.
 * `label` is the friendly name the user typed (e.g., "Polysomnography 2024").
 */
export async function uploadMedicalFile(file, label, userId) {
  const path = `medical_reports/${userId}/${Date.now()}_${file.name}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const url = await getDownloadURL(ref);
  return { name: label || file.name, url };
}

/**
 * Upload MANY medical files at once.
 * @param {Array<{file: File, label: string}>} items
 * @returns Promise<Array<{name, url}>>
 */
export async function uploadMedicalFiles(items, userId) {
  const out = [];
  for (const it of items || []) {
    // Skip empty rows
    if (!it?.file) continue;
    // eslint-disable-next-line no-await-in-loop
    out.push(await uploadMedicalFile(it.file, it.label, userId));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* PREDICTIONS WRITE                                                   */
/* ------------------------------------------------------------------ */

/**
 * Save one analysis under users/{userId}/predictions/{autoId}
 * payload shape:
 * {
 *   personalInfo,          // object from PersonalInfo form
 *   rows,                  // uploaded objective row(s)
 *   apiResponse,           // response from /predict
 *   clientMeta,            // { ua, url, ts }
 *   medicalFiles?: [{name, url}], // from uploadMedicalFiles (optional)
 * }
 */
export async function savePredictionRecord(userId, payload) {
  try {
    const userRef = doc(db, "users", userId);
    const predCol = collection(userRef, "predictions");
    const docRef = await addDoc(predCol, {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return { ok: true, id: docRef.id };
  } catch (e) {
    console.error("[Firestore] save failed:", e);
    return { ok: false, error: String(e) };
  }
}

/* ------------------------------------------------------------------ */
/* READS: ADMIN + PATIENT                                              */
/* ------------------------------------------------------------------ */

/**
 * ADMIN: list all predictions across all users (newest first).
 * NOTE: Requires Firestore rule that allows the admin account or PIN-gated page.
 */
export async function listAllPredictions(limitCount = 200) {
  const cg = collectionGroup(db, "predictions");
  const qy = query(cg, orderBy("createdAt", "desc"), qLimit(limitCount));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => {
    const data = d.data();
    const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
    return {
      id: d.id,
      ...data,
      createdAtDate: ts,
      createdAtISO: ts ? ts.toISOString() : "",
    };
  });
}

/**
 * PATIENT: list a patient's own predictions by userId.
 */
export async function listPredictionsByUser(userId, limitCount = 50) {
  const userRef = doc(db, "users", userId);
  const predCol = collection(userRef, "predictions");
  const qy = query(predCol, orderBy("createdAt", "desc"), qLimit(limitCount));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => {
    const data = d.data();
    const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
    return {
      id: d.id,
      ...data,
      createdAtDate: ts,
      createdAtISO: ts ? ts.toISOString() : "",
    };
  });
}

/**
 * Get a single prediction by user + record id.
 */
export async function getPredictionById(userId, recordId) {
  const ref = doc(db, "users", userId, "predictions", recordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
  return {
    id: snap.id,
    ...data,
    createdAtDate: ts,
    createdAtISO: ts ? ts.toISOString() : "",
  };
}

/* ------------------------------------------------------------------ */
/* CSV EXPORT (Excel-friendly)                                         */
/* ------------------------------------------------------------------ */

export function exportArrayToCSV(filename, rows, headerOrder) {
  if (!rows?.length) return;
  const headers = headerOrder || Object.keys(rows[0]);
  const esc = (v) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(",")]
    .concat(rows.map((r) => headers.map((h) => esc(r[h])).join(",")))
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

/**
 * Build a compact row for export from a prediction doc.
 * Works with our API schema (first row + first result).
 */
export function normalizeDocForCSV(doc) {
  const firstRow =
    Array.isArray(doc.rows) && doc.rows.length ? doc.rows[0] : {};
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
    prob_high: probs[2] ?? "",
  };
}

