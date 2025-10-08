import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey:       process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:   process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId:        process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  storageBucket:process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

export async function ensureSignedIn() {
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser;
}

export async function saveAnalysis({ personalInfo, uploadedRows, modelResponse }) {
  const user = await ensureSignedIn();
  const ref = await addDoc(collection(db, "analyses"), {
    uid: user?.uid || null,
    createdAt: serverTimestamp(),
    personalInfo: personalInfo || null,
    rowsCount: Array.isArray(uploadedRows) ? uploadedRows.length : 0,
    // optional: preview of first row
    sampleRow: Array.isArray(uploadedRows) && uploadedRows.length ? uploadedRows[0] : null,
    modelResponse
  });
  return ref.id;
}
