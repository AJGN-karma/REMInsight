from __future__ import annotations
import json, os
from typing import Any, Dict, Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

from .infer import load_artifacts, prepare_X_from_features, scale_numeric, predict_single
from .shap_explain import topk_shap

MODEL_PATH = os.getenv("MODEL_PATH", "models/xgb_model.joblib")
SCALER_PATH = os.getenv("SCALER_PATH", "models/scaler.joblib")
FEATURE_LIST_PATH = os.getenv("FEATURE_LIST_PATH", "models/feature_list.json")
API_TOKEN = os.getenv("API_TOKEN")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # add your Vercel domain:
    "https://reminsight.vercel.app"
]

app = FastAPI(title="REMInsight API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model at startup
model, scaler, feature_list = load_artifacts(MODEL_PATH, SCALER_PATH, FEATURE_LIST_PATH)
numeric_prefixes = [
    "age","psqi_c1","psqi_c2","psqi_c3","psqi_c4","psqi_c5","psqi_c6","psqi_c7","psqi_global",
    "TST_min","REM_total_min","REM_latency_min","REM_pct","REM_density","sleep_efficiency_pct",
    "micro_arousals_count","mean_delta_pow","mean_theta_pow","mean_alpha_pow","mean_beta_pow",
    "artifact_pct","percent_epochs_missing","psqi_rem_density_interaction","age_REM_latency_ratio","theta_alpha_ratio"
]

def auth_dep(token: Optional[str] = None):
    # Simple token stub: accept Authorization: Bearer <token> via FastAPI security normally,
    # here we just check the header through app dependencies.
    # In production replace with Firebase Admin verification if desired.
    return True

class PredictRequest(BaseModel):
    features: Dict[str, Any]

@app.get("/health")
def health():
    return {"status":"ok","model_path":MODEL_PATH}

@app.post("/predict")
def predict(req: PredictRequest, explain: bool = False):
    # Optional API_TOKEN check
    # For quick start we skip; uncomment lines below to enforce:
    # auth = os.getenv("API_TOKEN")
    # if auth and request.headers.get("Authorization") != f"Bearer {auth}":
    #     raise HTTPException(status_code=401, detail="Unauthorized")

    feats = req.features
    X = prepare_X_from_features(feats, feature_list)
    X = scale_numeric(X, scaler, numeric_prefixes)
    pred, proba, conf = predict_single(model, X)
    out = {"prediction": pred, "probabilities": proba, "label_confidence": conf}
    if explain:
        out["explanation"] = {"top5": topk_shap(model, X, 5)}
    return out

@app.post("/extract_and_predict")
async def extract_and_predict(file: UploadFile = File(...), explain: bool = False):
    # Accept CSV or JSON containing either full features row or raw signals (demo = features row)
    if file.filename.lower().endswith(".csv"):
        df = pd.read_csv(file.file)
        row = df.iloc[0].to_dict()
    elif file.filename.lower().endswith(".json"):
        data = json.loads((await file.read()).decode("utf-8"))
        if isinstance(data, dict):
            row = data
        elif isinstance(data, list):
            row = data[0]
        else:
            raise HTTPException(status_code=400, detail="Invalid JSON")
    else:
        raise HTTPException(status_code=415, detail="Only CSV or JSON supported in this demo")

    X = prepare_X_from_features(row, feature_list)
    X = scale_numeric(X, scaler, numeric_prefixes)
    pred, proba, conf = predict_single(model, X)
    out = {"prediction": pred, "probabilities": proba, "label_confidence": conf, "features_used": row}
    if explain:
        out["explanation"] = {"top5": topk_shap(model, X, 5)}
    return out
