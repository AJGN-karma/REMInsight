# Deployment Guide

## Backend (Render)

1. Push repo to GitHub.
2. Render → New → Web Service → **Docker** → Root `/api`.
3. Environment:
   - MODEL_PATH=/opt/app/models/xgb_model.joblib
   - SCALER_PATH=/opt/app/models/scaler.joblib
   - FEATURE_LIST_PATH=/opt/app/models/feature_list.json
   - API_TOKEN=prod-secret
   - (optional) FIREBASE_CREDENTIALS_JSON=...
4. Health check: `/health`
5. Deploy. Note service URL (e.g., `https://reminsight-api.onrender.com`).

## Frontend (Vercel)

1. Vercel → New Project → import GitHub repo → Root `/web`.
2. Env vars:
   - VITE_API_BASE=https://reminsight-api.onrender.com
   - VITE_FIREBASE_* (from Firebase console)
3. Deploy. Get URL (e.g., `https://reminsight.vercel.app`).

## Custom Domains
- Frontend: add your domain in Vercel → add DNS records at registrar → SSL auto.
- Backend: add subdomain in Render → CNAME to Render → SSL auto.

## Firebase
- Enable Email/Password in Auth.
- Create Firestore (prod mode).
- In frontend, after login get ID token → send as Authorization header to API.
- API can verify token using Firebase Admin (optional at first).
