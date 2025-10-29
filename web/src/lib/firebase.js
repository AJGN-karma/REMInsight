import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Save one analysis record (no auth for now; Firestore rules should be set accordingly for testing)
export async function savePredictionRecord(payload) {
  // payload: { personalInfo, rows, apiResponse, clientMeta }
  try {
    const col = collection(db, "predictions");
    const docRef = await addDoc(col, {
      ...payload,
      createdAt: serverTimestamp()
    });
    return { ok: true, id: docRef.id };
  } catch (e) {
    console.error("Firestore save failed:", e);
    return { ok: false, error: String(e) };
  }
}
