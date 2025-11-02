# api/src/api_server.py
from __future__ import annotations
import json, os, sys, logging
from pathlib import Path
from typing import List, Any, Dict, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s", stream=sys.stdout)
log = logging.getLogger("reminsight-api")

app = FastAPI(title="REMInsight API", version="1.0.0")

# ----- CORS (multi-origin) -----
FRONTEND_ORIGINS_RAW = os.getenv("FRONTEND_ORIGIN", "").strip()
if FRONTEND_ORIGINS_RAW:
    origins = [o.strip().rstrip("/") for o in FRONTEND_ORIGINS_RAW.split(",") if o.strip()]
    http_variants = []
    for o in origins:
        if o.startswith("https://"):
            http_variants.append(o.replace("https://", "http://", 1))
    origins += http_variants
else:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# ----- artifacts -----
MODEL_DIR = Path(os.getenv("MODEL_DIR", "./models"))
MODEL_PATH = MODEL_DIR / "xgb_model.joblib"
IMP_PATH   = MODEL_DIR / "imputer.joblib"
SCL_PATH   = MODEL_DIR / "scaler.joblib"
FEAT_PATH  = MODEL_DIR / "features.json"

_model = _imputer = _scaler = None
_features: Optional[List[str]] = None
_model_error: Optional[str] = None

def _try_load():
    global _model, _imputer, _scaler, _features, _model_error
    if _model is not None and _imputer is not None and _scaler is not None and _features is not None:
        return
    try:
        from joblib import load
        log.info("Loading artifacts from %s", MODEL_DIR.resolve())
        _features = json.loads(FEAT_PATH.read_text(encoding="utf-8"))
        _imputer = load(IMP_PATH)
        _scaler  = load(SCL_PATH)
        _model   = load(MODEL_PATH)
        _model_error = None
        log.info("Artifacts loaded: features=%d", len(_features))
    except Exception as e:
        _model = _imputer = _scaler = None
        try:
            _features = _features or json.loads(FEAT_PATH.read_text(encoding="utf-8"))
        except Exception:
            _features = _features or []
        _model_error = f"{type(e).__name__}: {e}"
        log.error("Model load failed: %s", _model_error)

# ----- schemas -----
class PredictRequest(BaseModel):
    rows: List[Dict[str, Any]]

class PredictResponseRow(BaseModel):
    pred_risk: int
    probs: List[float]
    row_index: Optional[int] = None

class PredictResponse(BaseModel):
    results: List[PredictResponseRow]
    features_used: List[str]
    coverage_ratio: float
    missing_columns: List[str] = []
    extra_columns: List[str] = []
    warning: Optional[str] = None

# ----- routes -----
@app.get("/__ping")
def ping():
    return {"ok": True}

@app.get("/health")
def health():
    _try_load()
    return {
        "status": "ok" if _model_error is None else "degraded",
        "model_loaded": _model is not None,
        "features": len(_features or []),
        "error": _model_error,
        "origins": FRONTEND_ORIGINS_RAW or "*",
    }

@app.get("/features")
def get_features():
    _try_load()
    return {"features": _features or []}

@app.get("/sample_row")
def sample_row():
    _try_load()
    return {name: None for name in (_features or [])}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    _try_load()
    if _model is None or _imputer is None or _scaler is None:
        raise HTTPException(status_code=503, detail=f"Model not available: {_model_error}")

    if not req.rows:
        return PredictResponse(
            results=[], features_used=_features or [], coverage_ratio=0.0,
            missing_columns=[], extra_columns=[], warning="No rows provided"
        )

    df = pd.DataFrame(req.rows)
    feats = _features or []
    missing = [c for c in feats if c not in df.columns]
    extra   = [c for c in df.columns if c not in feats]
    coverage = (len(feats) - len(missing)) / max(1, len(feats))

    X = df.reindex(columns=feats, fill_value=np.nan).values
    try:
        X_imp = _imputer.transform(X)
        X_scl = _scaler.transform(X_imp)
        probs = _model.predict_proba(X_scl)
    except Exception as e:
        log.exception("Prediction pipeline failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {type(e).__name__}: {e}")

    preds = probs.argmax(axis=1)
    results = [
        PredictResponseRow(pred_risk=int(preds[i]),
                           probs=[float(x) for x in probs[i]],
                           row_index=int(i))
        for i in range(len(df))
    ]

    warn = f"Missing {len(missing)} features: {missing[:5]}..." if missing else None
    return PredictResponse(
        results=results,
        features_used=feats,
        coverage_ratio=float(coverage),
        missing_columns=missing,
        extra_columns=extra,
        warning=warn
    )
