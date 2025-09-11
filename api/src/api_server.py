from __future__ import annotations
import json
from pathlib import Path
from typing import List, Optional, Any, Dict

import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from joblib import load
import os
from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- config ----------
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"  # ../models
MODEL_PATH = MODEL_DIR / "xgb_model.joblib"
IMP_PATH   = MODEL_DIR / "imputer.joblib"
SCL_PATH   = MODEL_DIR / "scaler.joblib"
FEAT_PATH  = MODEL_DIR / "features.json"

# ---------- load artifacts at startup ----------
model = load(MODEL_PATH)
imputer = load(IMP_PATH)
scaler = load(SCL_PATH)
features: List[str] = json.loads(FEAT_PATH.read_text(encoding="utf-8"))

app = FastAPI(title="REMInsight API", version="1.0.0")

# CORS for local dev and hosted frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    # One or more rows; keys should be column names used in training.
    rows: List[Dict[str, Any]]

class PredictResponseRow(BaseModel):
    pred_risk: int
    probs: List[float]

class PredictResponse(BaseModel):
    results: List[PredictResponseRow]
    features_used: List[str]

@app.get("/health")
def health():
    return {"status": "ok", "features": len(features)}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if not req.rows:
        return {"results": [], "features_used": features}
    df = pd.DataFrame(req.rows)

    # enforce feature order; missing features -> NaN
    X = df.reindex(columns=features, fill_value=np.nan).values
    X_imp = imputer.transform(X)
    X_scl = scaler.transform(X_imp)

    probs = model.predict_proba(X_scl)
    preds = probs.argmax(axis=1)

    results = []
    for i in range(len(df)):
        results.append(PredictResponseRow(
            pred_risk=int(preds[i]),
            probs=[float(x) for x in probs[i]]
        ))
    return PredictResponse(results=results, features_used=features)
