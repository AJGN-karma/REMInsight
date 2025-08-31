from __future__ import annotations
import json, joblib, os
import numpy as np
import pandas as pd
from typing import Dict, Any, List

def load_artifacts(model_path: str, scaler_path: str, feature_list_path: str):
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    with open(feature_list_path, "r", encoding="utf-8") as f:
        features = json.load(f)
    return model, scaler, features

def prepare_X_from_features(features_dict: Dict[str, Any], feature_list: List[str]) -> pd.DataFrame:
    # single row DataFrame, with dummy one-hot alignment already baked in training feature list
    df = pd.DataFrame([features_dict])
    # One-hot needs to be pre-aligned; here we assume categorical expansion happened in training
    # So we must ensure all expected columns exist
    X = pd.DataFrame(columns=feature_list)
    # Fill matching numeric/categorical base features → simple mapping if names match
    # For unseen categoricals, all zeros (handled because no matching one-hot column)
    for col in feature_list:
        if col in df.columns:
            X[col] = df[col]
        else:
            # try to map base name "sex_" one-hot etc.
            if "_" in col and any(col.startswith(p) for p in ["sex_", "site_", "device_model_"]):
                base = col.split("_", 1)[0]
                val = str(features_dict.get(base, ""))
                X[col] = 1 if col == f"{base}_{val}" else 0
            else:
                X[col] = 0
    return X

def scale_numeric(X: pd.DataFrame, scaler, numeric_prefixes: List[str]):
    num_cols = [c for c in X.columns if any(c.startswith(p) for p in numeric_prefixes)]
    X.loc[:, num_cols] = scaler.transform(X[num_cols])
    return X

def predict_single(model, X: pd.DataFrame):
    proba = model.predict_proba(X)[0]
    pred = int(np.argmax(proba))
    conf = float(proba[pred])
    return pred, proba.tolist(), conf
