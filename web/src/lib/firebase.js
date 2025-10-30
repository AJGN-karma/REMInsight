// web/src/lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// ---- Read env (Next.js exposes NEXT_PUBLIC_* at runtime) ----
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Basic sanity check so we fail loudly if env is missing
const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
const missing = requiredKeys.filter((k) => !firebaseConfig[k]);
if (missing.length) {
  // Don’t throw—still let UI run; we’ll just log for visibility.
  console.warn(
    "[Firebase] Missing config keys:",
    missing.join(", "),
    "→ add them in Vercel Project Settings → Environment Variables."
  );
}

// Initialize exactly once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Save one prediction record to Firestore.
 * @param {{ personalInfo?: object, rows?: object[], apiResponse: {results:any[], features_used:string[]}, clientMeta?: object }} payload
 * @returns {Promise<{ok: boolean, id?: string, error?: string}>}
 */
export async function savePredictionRecord(payload) {
  try {
    // Normalize & trim payload to keep docs small and safe for free tier
    const normalized = {
      createdAt: serverTimestamp(),
      personalInfo: payload?.personalInfo ?? null,
      // Keep at most first 25 uploaded rows to prevent huge docs
      rows: Array.isArray(payload?.rows)
        ? payload.rows.slice(0, 25)
        : null,
      apiResponse: payload?.apiResponse ?? null,
      clientMeta: {
        ...payload?.clientMeta,
        // guard against crazy-long userAgent strings
        ua: (payload?.clientMeta?.ua || "").substring(0, 300),
      },
    };

    const col = collection(db, "predictions");
    const docRef = await addDoc(col, normalized);
    return { ok: true, id: docRef.id };
  } catch (e) {
    console.error("[Firebase] Firestore save failed:", e);
    return { ok: false, error: String(e) };
  }
}
