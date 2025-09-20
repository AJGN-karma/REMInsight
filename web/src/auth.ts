import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  User,
} from "firebase/auth";

/**
 * Firebase config pulled from public env vars.
 * These MUST be set in Vercel Project Settings:
 *  - NEXT_PUBLIC_FIREBASE_API_KEY
 *  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *  - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *  - NEXT_PUBLIC_FIREBASE_APP_ID
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize (avoid duplicate init during hot reloads/builds)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

/** Ensure the user is signed in anonymously (simple, no UI). */
export async function ensureAnonAuth(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

/**
 * REQUIRED by DataCollection.tsx
 * Get an ID token if available. Returns null if anything fails.
 */
export async function getIdTokenOrNull(): Promise<string | null> {
  try {
    const user = await ensureAnonAuth();
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/** Optional helper if you ever need to observe auth state. */
export function onAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}
