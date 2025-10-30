from __future__ import annotations
import json
import os
from pathlib import Path
from typing import List, Any, Dict

import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from joblib import load

# ---------- create app ----------
app = FastAPI(title="REMInsight API", version="1.0.0")

# ---------- CORS setup ----------
FRONTEND_ORIGINS_RAW = os.getenv("FRONTEND_ORIGIN", "").strip()
if FRONTEND_ORIGINS_RAW:
    # Support comma-separated list of origins
    origins = [o.strip().rstrip("/") for o in FRONTEND_ORIGINS_RAW.split(",") if o.strip()]
    more = []
    for o in origins:
        if o.startswith("https://"):
            more.append(o.replace("https://", "http://", 1))
    origins += more
else:
    # Allow all if not specified (no credentials)
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # keep False if using "*" origins
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# ---------- config ----------
MODEL_DIR = Path(os.getenv("MODEL_DIR", "./models"))
MODEL_PATH = MODEL_DIR / "xgb_model.joblib"
IMP_PATH   = MODEL_DIR / "imputer.joblib"
SCL_PATH   = MODEL_DIR / "scaler.joblib"
FEAT_PATH  = MODEL_DIR / "features.json"

# ---------- load artifacts ----------
model = load(MODEL_PATH)
imputer = load(IMP_PATH)
scaler = load(SCL_PATH)
features: List[str] = json.loads(FEAT_PATH.read_text(encoding="utf-8"))

# ---------- request/response models ----------
class PredictRequest(BaseModel):
    rows: List[Dict[str, Any]]

class PredictResponseRow(BaseModel):
    pred_risk: int
    probs: List[float]

class PredictResponse(BaseModel):
    results: List[PredictResponseRow]
    features_used: List[str]

# ---------- routes ----------
@app.get("/health")
def health():
    return {"status": "ok", "features": len(features)}

@app.get("/features")
def get_features():
    return {"features": features}

@app.get("/sample_row")
def sample_row():
    return {name: None for name in features}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if not req.rows:
        return {"results": [], "features_used": features}

    df = pd.DataFrame(req.rows)
    X = df.reindex(columns=features, fill_value=np.nan).values
    X_imp = imputer.transform(X)
    X_scl = scaler.transform(X_imp)

    probs = model.predict_proba(X_scl)
    preds = probs.argmax(axis=1)

    results = [
        PredictResponseRow(
            pred_risk=int(preds[i]),
            probs=[float(x) for x in probs[i]]
        )
        for i in range(len(df))
    ]
    return PredictResponse(results=results, features_used=features)
