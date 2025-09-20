// web/src/auth.ts
// Client-only Firebase init for Next.js


"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
};

for (const [k, v] of Object.entries(cfg)) {
  if (!v) {
    throw new Error(
      `Missing Firebase env: ${k}. Set it in Vercel → Project → Settings → Environment Variables.`
    );
  }
}

const app = getApps().length ? getApps()[0] : initializeApp(cfg);
export const auth = getAuth(app);
