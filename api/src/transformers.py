import joblib, json
from typing import List

def load_joblib_safe(path: str):
    try:
        return joblib.load(path)
    except Exception as e:
        raise RuntimeError(f"Failed to load joblib at {path}: {e}")

def load_features(path: str) -> List[str]:
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return []

def preprocess_rows(rows: list, features: List[str], imputer=None, scaler=None):
    import numpy as np
    X = [[float(r.get(f, 0.0)) for f in features] for r in rows]
    X = np.array(X, dtype=float)
    if imputer is not None:
        X = imputer.transform(X)
    if scaler is not None:
        X = scaler.transform(X)
    return X
