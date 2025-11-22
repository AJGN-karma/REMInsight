from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import os, json

from .config import MODEL_PATH, SCALER_PATH, IMPUTER_PATH, ALLOWED_ORIGINS_LIST, MODEL_VERSION, PROVENANCE_PATH, SHAP_ENABLED, RELOAD_SECRET

from .infer import predict
from .utils import load_json_safe, logger

app = FastAPI(title="REMInsight API", version=MODEL_VERSION)

origins = ALLOWED_ORIGINS_LIST or ["*"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class InputRow(BaseModel):
    age: float
    psqi_c1: float
    psqi_c2: float
    psqi_c3: float
    psqi_c4: float
    psqi_c5: float
    psqi_c6: float
    psqi_c7: float
    TST_min: float
    REM_total_min: float
    REM_latency_min: float
    REM_pct: float
    REM_density: float
    sleep_efficiency_pct: float
    micro_arousals_count: float
    mean_delta_pow: float
    mean_theta_pow: float
    mean_alpha_pow: float
    mean_beta_pow: float
    artifact_pct: float
    percent_epochs_missing: float
    psqi_global: float
    rem_to_tst_ratio: float
    rem_latency_ratio: float

class PredictRequest(BaseModel):
    rows: List[InputRow] = Field(..., min_items=1)

@app.get("/health")
def health():
    prov = load_json_safe(PROVENANCE_PATH)
    model_loaded = os.path.exists(MODEL_PATH)
    return {"status":"ok","model_loaded":model_loaded,"model_version":MODEL_VERSION,"training_provenance":prov}

@app.get("/features")
def features():
    try:
        with open("api/models/features.json") as f:
            feats = json.load(f)
    except Exception:
        feats = []
    return {"features": feats, "model_version": MODEL_VERSION}

@app.post("/predict")
def api_predict(req: PredictRequest):
    rows = [r.dict() for r in req.rows]
    try:
        preds, probs = predict(rows, MODEL_PATH, IMPUTER_PATH, SCALER_PATH, "api/models/features.json")
    except Exception as e:
        logger.exception("predict error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    return {"predictions": preds, "probabilities": probs, "model_version": MODEL_VERSION}

@app.post("/_reload")
def reload(secret: str = ""):
    if RELOAD_SECRET and secret != RELOAD_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"reloaded": True}

if SHAP_ENABLED:
    from .shap_explain import explain_rows
    @app.post("/explain")
    def api_explain(req: PredictRequest):
        rows = [r.dict() for r in req.rows]
        import numpy as np
        from .transformers import load_features, load_joblib_safe
        feats = load_features("api/models/features.json")
        model = load_joblib_safe(MODEL_PATH)
        X = np.array([[float(r.get(f, 0.0)) for f in feats] for r in rows], dtype=float)
        exp = explain_rows(model, X, feats, top_k=5)
        return {"explanations": exp}
