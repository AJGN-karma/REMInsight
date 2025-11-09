// web/src/lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  collectionGroup,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit as qLimit,
  serverTimestamp,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

/* ----------------------------- ENV + INIT ----------------------------- */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/* ------------------------------- AUTH -------------------------------- */
export async function ensureAnonAuth() {
  if (auth.currentUser) return auth.currentUser;
  await signInAnonymously(auth);
  return auth.currentUser;
}
export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}
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

/* ---------------------------- USER PROFILE --------------------------- */
export async function upsertUserProfile(userId, profile) {
  const userRef = doc(db, "users", userId);
  await setDoc(
    userRef,
    {
      profile: { ...(profile || {}), updatedAt: serverTimestamp() },
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/* ------------------------- PDF → Firestore Base64 --------------------- */
const BASE64_INLINE_LIMIT = 800 * 1024; // ~800KB

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result; // data:<mime>;base64,XXXX
      const b64 = String(result).split(",")[1] || "";
      resolve({ base64: b64, mimeType: file.type || "application/pdf" });
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function base64SizeBytes(b64) {
  return Math.floor((b64.length * 3) / 4);
}

export async function uploadMedicalFileBase64(file, label, userId) {
  const { base64, mimeType } = await fileToBase64(file);
  const sizeBytes = base64SizeBytes(base64);
  const name = label || file.name || "medical-report.pdf";

  const uploadsCol = collection(doc(db, "users", userId), "uploads");

  if (sizeBytes <= BASE64_INLINE_LIMIT) {
    const docRef = await addDoc(uploadsCol, {
      name,
      mimeType,
      sizeBytes,
      chunked: false,
      dataBase64: base64,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, name, mimeType, sizeBytes, chunked: false };
  }

  // Chunked
  const parentRef = await addDoc(uploadsCol, {
    name,
    mimeType,
    sizeBytes,
    chunked: true,
    totalChunks: 0,
    createdAt: serverTimestamp(),
  });

  const CHUNK_SIZE = 600 * 1024; // 600KB chars per chunk
  const chunks = [];
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    chunks.push(base64.slice(i, i + CHUNK_SIZE));
  }
  const chunksCol = collection(parentRef, "chunks");
  for (let i = 0; i < chunks.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    await addDoc(chunksCol, { idx: i, data: chunks[i] });
  }
  await setDoc(parentRef, { totalChunks: chunks.length }, { merge: true });

  return {
    id: parentRef.id,
    name,
    mimeType,
    sizeBytes,
    chunked: true,
    totalChunks: chunks.length,
  };
}

export async function getMedicalFileURL(userId, uploadId) {
  const ref = doc(db, "users", userId, "uploads", uploadId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Upload not found");
  const meta = snap.data();
  const mimeType = meta.mimeType || "application/pdf";

  let base64 = "";
  if (!meta.chunked) {
    base64 = meta.dataBase64 || "";
  } else {
    const chunksCol = collection(ref, "chunks");
    const qs = query(chunksCol, orderBy("idx", "asc"));
    const chunksSnap = await getDocs(qs);
    base64 = chunksSnap.docs.map((d) => d.data().data || "").join("");
  }

  const byteCharacters = atob(base64);
  const byteArrays = [];
  const sliceSize = 32 * 1024;
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  const blob = new Blob(byteArrays, { type: mimeType });
  const url = URL.createObjectURL(blob);
  return { url, mimeType, name: meta.name || "medical-report.pdf" };
}

/* -------------------------- PREDICTION CRUD -------------------------- */
function _genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `a${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// CREATE — always new doc id (prevents silent overwrites)
export async function createPrediction(userId, payload) {
  const predCol = collection(doc(db, "users", userId), "predictions");
  const id = _genId();
  const safe = { ...payload };
  if (safe.medicalFileBase64) delete safe.medicalFileBase64;

  await setDoc(
    doc(predCol, id),
    {
      ...safe,
      id,
      createdAt: serverTimestamp(),
      createdAtMs: Date.now(),
    },
    { merge: true }
  );
  return { ok: true, id };
}

// UPSERT (kept for callers that pass an id, but we auto-avoid overwrites)
export async function savePredictionRecordUpsert(userId, analysisId, payload) {
  try {
    const predCol = collection(doc(db, "users", userId), "predictions");
    let id = analysisId || _genId();

    const maybe = await getDoc(doc(predCol, id));
    if (maybe.exists()) {
      id = _genId(); // avoid accidental overwrite
    }

    const safe = { ...payload };
    if (safe.medicalFileBase64) delete safe.medicalFileBase64;

    await setDoc(
      doc(predCol, id),
      {
        ...safe,
        id,
        createdAt: serverTimestamp(),
        createdAtMs: Date.now(),
      },
      { merge: true }
    );
    return { ok: true, id };
  } catch (e) {
    console.error("[Firestore] upsert failed:", e);
    return { ok: false, error: String(e) };
  }
}

// READ (single)
export async function getPredictionById(userId, recordId) {
  const ref = doc(db, "users", userId, "predictions", recordId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
  return {
    id: data.id || snap.id,
    userId,
    ...data,
    createdAtDate: ts,
    createdAtISO: ts ? ts.toISOString() : "",
  };
}

// UPDATE
export async function updatePrediction(userId, recordId, updates) {
  const ref = doc(db, "users", userId, "predictions", recordId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  return { ok: true };
}

// DELETE
export async function deletePrediction(userId, recordId) {
  const ref = doc(db, "users", userId, "predictions", recordId);
  await deleteDoc(ref);
  return { ok: true };
}

/* ----------------------- LISTS (+ robust fallbacks) ------------------- */
// Admin: all predictions (collectionGroup)
export async function listAllPredictions(limitCount = 200) {
  const cg = collectionGroup(db, "predictions");
  try {
    const q1 = query(cg, orderBy("createdAt", "desc"), qLimit(limitCount));
    const snap = await getDocs(q1);
    return snap.docs.map((d) => {
      const data = d.data();
      const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
      const userId = d.ref.parent?.parent ? d.ref.parent.parent.id : "";
      return {
        id: data.id || d.id,
        userId,
        ...data,
        createdAtDate: ts,
        createdAtISO: ts ? ts.toISOString() : "",
      };
    });
  } catch (e) {
    // Fallback that does not need the single-field index
    const q2 = query(cg, orderBy("__name__", "desc"), qLimit(limitCount));
    const snap = await getDocs(q2);
    const rows = snap.docs.map((d) => {
      const data = d.data();
      const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
      const userId = d.ref.parent?.parent ? d.ref.parent.parent.id : "";
      return {
        id: data.id || d.id,
        userId,
        ...data,
        createdAtDate: ts,
        createdAtISO: ts ? ts.toISOString() : "",
      };
    });
    rows.sort((a, b) => (b.createdAtDate?.getTime() || 0) - (a.createdAtDate?.getTime() || 0));
    return rows;
  }
}

// Per-user history
export async function listPredictionsByUser(userId, limitCount = 50) {
  const predCol = collection(doc(db, "users", userId), "predictions");
  try {
    const q1 = query(predCol, orderBy("createdAt", "desc"), qLimit(limitCount));
    const snap = await getDocs(q1);
    return snap.docs.map((d) => {
      const data = d.data();
      const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
      return {
        id: data.id || d.id,
        userId,
        ...data,
        createdAtDate: ts,
        createdAtISO: ts ? ts.toISOString() : "",
      };
    });
  } catch (e) {
    // Fallback
    const q2 = query(predCol, orderBy("__name__", "desc"), qLimit(limitCount));
    const snap = await getDocs(q2);
    const rows = snap.docs.map((d) => {
      const data = d.data();
      const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
      return {
        id: data.id || d.id,
        userId,
        ...data,
        createdAtDate: ts,
        createdAtISO: ts ? ts.toISOString() : "",
      };
    });
    rows.sort((a, b) => (b.createdAtDate?.getTime() || 0) - (a.createdAtDate?.getTime() || 0));
    return rows;
  }
}

/* ---------------------------- CSV EXPORT ----------------------------- */
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

export function normalizeDocForCSV(doc) {
  const firstRow = Array.isArray(doc.rows) && doc.rows.length ? doc.rows[0] : {};
  const firstRes = doc.apiResponse?.results?.[0] || {};
  const probs = Array.isArray(firstRes.probs) ? firstRes.probs : [];
  return {
    id: doc.id,
    userId: doc.userId || doc.personalInfo?.userId || "",
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
    prob_high: probs[2] ?? "",
  };
}
