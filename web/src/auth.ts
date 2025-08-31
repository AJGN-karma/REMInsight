import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(cfg);
export const auth = getAuth(app);

export async function getIdTokenOrNull(): Promise<string | null> {
  const u = auth.currentUser;
  return u ? u.getIdToken(true) : null;
}
