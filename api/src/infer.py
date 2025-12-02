# api/src/infer.py
"""
Inference utilities for REMInsight API.

Provides:
 - load_version(version: Optional[str]) -> (model, features, artifacts_dir)
 - predict_single(sample: dict, version: Optional[str]=None, return_shap: bool=False)
 - predict_batch(rows: List[dict], version: Optional[str]=None, return_shap: bool=False)

Behavior:
 - Model versions live under api/models/vYYYY.../
 - Expects features_full.json or features.json to list required feature names.
 - Optional artifacts per-version: scaler.joblib, imputer.joblib
 - Supports XGBoost Booster and scikit-learn estimators.
 - Uses Tree SHAP when return_shap=True (fallbacks handled).
"""

from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any
import joblib
import json
import numpy as np
import traceback
import logging
import math

logger = logging.getLogger("rem_infer")
if not logger.handlers:
    h = logging.StreamHandler()
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    h.setFormatter(fmt)
    logger.addHandler(h)
logger.setLevel(logging.INFO)

ROOT_DIR = Path(__file__).resolve().parents[1]  # api/
MODELS_DIR = ROOT_DIR / "models"

# simple cache to avoid reloads per request
_cache: Dict[str, Any] = {
    "version": None,
    "model": None,
    "features": None,
    "scaler": None,
    "imputer": None,
    "version_dir": None,
}

# Utilities ------------------------------------------------------------------
def _list_versions(prefix: str = "v") -> List[Path]:
    if not MODELS_DIR.exists():
        return []
    return sorted([p for p in MODELS_DIR.iterdir() if p.is_dir() and p.name.startswith(prefix)])

def _load_json_safe(p: Path):
    try:
        return json.loads(p.read_text())
    except Exception:
        return None

def _is_xgboost_model(m):
    try:
        import xgboost as xgb
        return isinstance(m, xgb.Booster) or m.__class__.__name__.lower().startswith("booster")
    except Exception:
        return False

def _to_numpy_matrix(df_row_values):
    # ensure 2D numpy array
    arr = np.asarray(df_row_values, dtype=float)
    if arr.ndim == 1:
        return arr.reshape(1, -1)
    return arr

# Loading --------------------------------------------------------------------
def load_version(version: Optional[str] = None) -> Tuple[Any, List[str], Path]:
    """
    Load model and artifacts for a version. If version is None, load latest.
    Returns (model, features_list, version_dir)
    """
    # already cached?
    if version is None and _cache["version"] and _cache["model"]:
        return _cache["model"], _cache["features"], Path(_cache["version_dir"])

    versions = _list_versions()
    if not versions:
        raise FileNotFoundError("No model versions found under api/models/. Train and create a model first.")

    version_dir: Path
    if version:
        version_dir = MODELS_DIR / version
        if not version_dir.exists():
            raise FileNotFoundError(f"Requested version not found: {version}")
    else:
        version_dir = versions[-1]

    # load model
    model_path = version_dir / "model.joblib"
    if not model_path.exists():
        raise FileNotFoundError(f"model.joblib not found in version directory: {version_dir}")

    model = joblib.load(model_path)

    # load features
    features = None
    for fname in ("features_full.json", "features.json"):
        fpath = version_dir / fname
        if fpath.exists():
            features = _load_json_safe(fpath)
            break
    if not features:
        raise FileNotFoundError(f"No features_full.json or features.json found in {version_dir}")

    # optional scaler/imputer
    scaler = None
    imputer = None
    scaler_path = version_dir / "scaler.joblib"
    imputer_path = version_dir / "imputer.joblib"
    if scaler_path.exists():
        try:
            scaler = joblib.load(scaler_path)
        except Exception:
            logger.warning("Failed to load scaler at %s", scaler_path)
    if imputer_path.exists():
        try:
            imputer = joblib.load(imputer_path)
        except Exception:
            logger.warning("Failed to load imputer at %s", imputer_path)

    # cache only when version is latest (version param None)
    if version is None:
        _cache.update({
            "version": version_dir.name,
            "model": model,
            "features": features,
            "scaler": scaler,
            "imputer": imputer,
            "version_dir": str(version_dir),
        })
    return model, features, version_dir

# Prediction helpers ---------------------------------------------------------
def _prepare_array_from_row(row: dict, features: List[str], imputer=None, scaler=None):
    # produce numpy 2D array in same order as features
    vals = [row.get(f, 0.0) for f in features]
    X = _to_numpy_matrix(vals)
    # imputer expects 2D numeric array
    if imputer is not None:
        try:
            X = imputer.transform(X)
        except Exception:
            # some imputers expect pandas; fallback
            import numpy as _np
            X = _np.nan_to_num(X)
    if scaler is not None:
        try:
            X = scaler.transform(X)
        except Exception:
            pass
    return X

def _predict_with_model(model, X: np.ndarray):
    """
    Accepts numpy 2D array X and returns:
      - probs: array-like of positive-class probability (binary) or array (n_samples, n_classes)
      - preds: integer predictions (0/1 or class index)
    """
    # XGBoost Booster
    try:
        import xgboost as xgb
        if isinstance(model, xgb.Booster) or model.__class__.__name__.lower().startswith("booster"):
            dmat = xgb.DMatrix(X)
            preds = model.predict(dmat)
            # xgboost returns prob for binary, or array for multiclass flatten? handle binary
            if preds.ndim == 1:
                # binary probability
                probs = preds
                binary_preds = (probs >= 0.5).astype(int)
                return probs, binary_preds
            else:
                # multiclass: preds shape (n_samples, n_classes)
                probs = preds
                class_preds = np.argmax(probs, axis=1)
                return probs, class_preds
    except Exception:
        # not xgboost or xgboost not installed; continue
        pass

    # scikit-learn style
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X)
        if probs.ndim == 2 and probs.shape[1] == 2:
            # binary: take positive class probability
            pos_probs = probs[:, 1]
            preds = (pos_probs >= 0.5).astype(int)
            return pos_probs, preds
        else:
            # multiclass: return full prob matrix and argmax
            preds = np.argmax(probs, axis=1)
            return probs, preds
    else:
        # fallback to predict
        preds = model.predict(X)
        # if predict returns probabilities, try to coerce
        try:
            preds = np.asarray(preds)
            # if array of floats between 0 and 1 assume probabilities
            if np.all((preds >= 0.0) & (preds <= 1.0)):
                probs = preds
                preds_bin = (probs >= 0.5).astype(int)
                return probs, preds_bin
        except Exception:
            pass
        return preds, preds

# SHAP helpers ---------------------------------------------------------------
def _compute_shap(model, X: np.ndarray, features: List[str], nsamples: int = 200):
    """
    Return shap importance dict for the first row in X.
    nsamples controls sampling size when X large.
    """
    try:
        import shap
    except Exception as e:
        logger.warning("SHAP not available: %s", e)
        return {"error": "shap_not_installed"}

    # shap.TreeExplainer supports xgboost and tree models best.
    try:
        # shap expects 2D array or pandas DataFrame
        if X.shape[0] > nsamples:
            # sample rows for memory
            idx = np.random.choice(X.shape[0], nsamples, replace=False)
            X_sample = X[idx]
        else:
            X_sample = X

        explainer = shap.TreeExplainer(model)
        shap_vals = explainer.shap_values(X_sample)
        # shap_values can be list (multi-class) or array
        if isinstance(shap_vals, list):
            # choose last class explanation or positive class if binary
            arr = shap_vals[-1]
        else:
            arr = shap_vals
        # return info for the first sample (or corresponding to X_sample[0])
        first = arr[0] if arr.ndim == 2 else arr
        # map features -> shap value
        return dict(zip(features, [float(x) for x in first.tolist()]))
    except Exception:
        logger.warning("SHAP calculation failed: %s", traceback.format_exc())
        return {"error": "shap_failed"}

# Public API -----------------------------------------------------------------
def predict_single(sample: dict, version: Optional[str] = None, return_shap: bool = False) -> Dict[str, Any]:
    """
    Predict for a single sample (dict). Returns:
      {
        "prediction": int or class,
        "probability": float (binary) or list (multiclass),
        "version": "vYYYY...",
        "shap_values": {feat: val} (optional)
      }
    """
    try:
        model, features, version_dir = load_version(version)
        # try to reuse cached scaler/imputer if loaded in cache (only if version None)
        scaler = None
        imputer = None
        if version is None and _cache.get("scaler") is not None:
            scaler = _cache.get("scaler")
            imputer = _cache.get("imputer")
        else:
            # attempt to load from version dir
            scaler_path = version_dir / "scaler.joblib"
            imputer_path = version_dir / "imputer.joblib"
            if scaler_path.exists():
                try:
                    scaler = joblib.load(scaler_path)
                except Exception:
                    logger.warning("Failed to load scaler from %s", scaler_path)
            if imputer_path.exists():
                try:
                    imputer = joblib.load(imputer_path)
                except Exception:
                    logger.warning("Failed to load imputer from %s", imputer_path)

        X = _prepare_array_from_row(sample, features, imputer=imputer, scaler=scaler)
        probs, preds = _predict_with_model(model, X)
        # choose value to return
        if isinstance(probs, np.ndarray) and probs.ndim == 2:
            # multiclass: return prob matrix as list
            prob_out = probs[0].tolist()
            pred_out = int(preds[0]) if hasattr(preds, "__iter__") else int(preds)
        else:
            prob_out = float(probs[0]) if hasattr(probs, "__iter__") else float(probs)
            pred_out = int(preds[0]) if hasattr(preds, "__iter__") else int(preds)

        out = {
            "prediction": pred_out,
            "probability": prob_out,
            "version": version_dir.name
        }

        if return_shap:
            shap_vals = _compute_shap(model, X, features, nsamples=200)
            out["shap_values"] = shap_vals

        return out
    except Exception as e:
        logger.error("predict_single error: %s", traceback.format_exc())
        raise RuntimeError(f"predict_single failed: {e}")

def predict_batch(rows: List[dict], version: Optional[str] = None, return_shap: bool = False) -> List[Dict[str, Any]]:
    """
    Predict for a list of row dicts. Returns list of predict_single outputs.
    """
    results = []
    try:
        model, features, version_dir = load_version(version)
        # pre-load scaler/imputer
        scaler = None
        imputer = None
        scaler_path = version_dir / "scaler.joblib"
        imputer_path = version_dir / "imputer.joblib"
        if scaler_path.exists():
            try:
                scaler = joblib.load(scaler_path)
            except Exception:
                logger.warning("Failed to load scaler from %s", scaler_path)
        if imputer_path.exists():
            try:
                imputer = joblib.load(imputer_path)
            except Exception:
                logger.warning("Failed to load imputer from %s", imputer_path)

        # build X
        X_list = []
        for r in rows:
            X_list.append([r.get(f, 0.0) for f in features])
        X = np.asarray(X_list, dtype=float)
        # apply imputer/scaler if available
        if imputer is not None:
            try:
                X = imputer.transform(X)
            except Exception:
                pass
        if scaler is not None:
            try:
                X = scaler.transform(X)
            except Exception:
                pass

        probs, preds = _predict_with_model(model, X)
        # prepare outputs
        for i in range(X.shape[0]):
            if isinstance(probs, np.ndarray) and probs.ndim == 2:
                prob_out = probs[i].tolist()
                pred_out = int(preds[i])
            else:
                prob_out = float(probs[i]) if hasattr(probs, "__iter__") else float(probs)
                pred_out = int(preds[i]) if hasattr(preds, "__iter__") else int(preds)
            entry = {"prediction": pred_out, "probability": prob_out, "version": version_dir.name}
            if return_shap:
                # compute shap per-sample (may be slow) — we compute with sampled data
                sv = _compute_shap(model, X, features, nsamples=200)
                entry["shap_values"] = sv
            results.append(entry)
        return results
    except Exception as e:
        logger.error("predict_batch error: %s", traceback.format_exc())
        raise RuntimeError(f"predict_batch failed: {e}")
