# api/src/api_server.py
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
# If you set FRONTEND_ORIGIN (e.g., https://rem-insight.vercel.app), only that origin is allowed.
# If it's unset, we allow "*" for simplicity during development.
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "").rstrip("/")
origins = [FRONTEND_ORIGIN] if FRONTEND_ORIGIN else ["*"]

# Also allow http variant for the same host (useful in previews/local)
if FRONTEND_ORIGIN.startswith("https://"):
    origins.append(FRONTEND_ORIGIN.replace("https://", "http://", 1))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- config ----------
# You can override this with env var MODEL_DIR, otherwise it uses ./models
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
    """Basic health check; also returns how many features are expected."""
    return {"status": "ok", "features": len(features)}

@app.get("/features")
def get_features():
    """
    Returns the exact, ordered list of feature names the model expects.
    Frontends can use this to validate/shape uploaded CSV/JSON.
    """
    return {"features": features}

@app.get("/sample_row")
def sample_row():
    """
    Returns a template object where keys are the feature names and values are null.
    Useful for constructing example CSV/JSON rows on the frontend.
    """
    return {name: None for name in features}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    """
    Accepts: {"rows": [ {<feature>: value, ...}, ... ]}
    Order does not matter; we reindex columns to 'features' and fill missing with NaN.
    """
    if not req.rows:
        return {"results": [], "features_used": features}

    df = pd.DataFrame(req.rows)

    # enforce feature order; fill missing with NaN (imputer handles them)
    X = df.reindex(columns=features, fill_value=np.nan).values
    X_imp = imputer.transform(X)
    X_scl = scaler.transform(X_imp)

    probs = model.predict_proba(X_scl)  # shape: (n_rows, n_classes)
    preds = probs.argmax(axis=1)

    results = [
        PredictResponseRow(
            pred_risk=int(preds[i]),
            probs=[float(x) for x in probs[i]]
        )
        for i in range(len(df))
    ]

    return PredictResponse(results=results, features_used=features)
