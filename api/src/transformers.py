import json
import joblib
from pathlib import Path
import numpy as np

def load_joblib_safe(path):
    p = Path(path)
    if not p.exists():
        return None
    return joblib.load(str(p))

def load_features(path):
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"features.json missing: {path}")
    return json.loads(p.read_text(encoding="utf-8"))

def preprocess_rows(rows, features_order, imputer=None, scaler=None):
    X = []
    for r in rows:
        arr = []
        for f in features_order:
            v = r.get(f, None)
            arr.append(np.nan if v is None else float(v))
        X.append(arr)
    X = np.array(X, dtype=np.float32)
    if imputer is not None:
        X = imputer.transform(X)
    if scaler is not None:
        X = scaler.transform(X)
    return X
