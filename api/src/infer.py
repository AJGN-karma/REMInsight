# backward compatibility: import predict_single from infer implementation
from .infer import predict_single
# above line added by me
import joblib, json
from pathlib import Path
import numpy as np
from .utils import logger

ROOT = Path(__file__).resolve().parent
MODELS_DIR = (ROOT.parent / "models").resolve()

_cache = {"model": None, "features": None, "version_dir": None}

def _list_versions(prefix="v"):
    return sorted([p for p in MODELS_DIR.iterdir() if p.is_dir() and p.name.startswith(prefix)])

def load_version(version: str = None):
    if version is None:
        versions = _list_versions()
        if not versions:
            raise FileNotFoundError("No model versions found. Train first.")
        version_dir = versions[-1]
    else:
        version_dir = MODELS_DIR / version
        if not version_dir.exists():
            raise FileNotFoundError(f"Version not found: {version}")
    if _cache["version_dir"] == str(version_dir) and _cache["model"] is not None:
        return _cache["model"], _cache["features"], version_dir
    model = joblib.load(version_dir / "model.joblib")
    feat_file = version_dir / "features_full.json"
    features = json.load(open(feat_file)) if feat_file.exists() else json.load(open(version_dir / "features.json"))
    _cache.update({"model": model, "features": features, "version_dir": str(version_dir)})
    logger.info("Loaded model version %s", version_dir.name)
    return model, features, version_dir

def predict_single(sample: dict, version: str = None, return_shap: bool = False):
    model, features, version_dir = load_version(version)
    import pandas as pd
    X = pd.DataFrame([sample], columns=features).fillna(0)
    if "subject_id" in X.columns:
        X = X.drop(columns=["subject_id"])
    try:
        import xgboost as xgb
        dmat = xgb.DMatrix(X)
        probs = model.predict(dmat)
    except Exception:
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X)[:,1]
        else:
            probs = model.predict(X)
    prob0 = float(probs[0]) if hasattr(probs, "__iter__") else float(probs)
    pred = int(prob0 >= 0.5)
    out = {"prediction": pred, "probability": prob0, "version": version_dir.name}
    if return_shap:
        try:
            import shap
            explainer = shap.TreeExplainer(model)
            shap_vals = explainer.shap_values(X)
            if isinstance(shap_vals, list):
                arr = shap_vals[1] if len(shap_vals) > 1 else shap_vals[0]
            else:
                arr = shap_vals
            importance = dict(zip(features, arr[0].tolist()))
            out["shap_values"] = importance
        except Exception as e:
            out["shap_error"] = str(e)
    return out

