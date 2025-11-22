from pathlib import Path
from .transformers import load_joblib_safe, load_features, preprocess_rows
from .utils import logger

_MODEL = None
_IMPUTER = None
_SCALER = None
_FEATURES = None

def _load_artifacts(model_path, imputer_path, scaler_path, features_path):
    global _MODEL, _IMPUTER, _SCALER, _FEATURES
    if _MODEL is None and Path(model_path).exists():
        _MODEL = load_joblib_safe(model_path)
        logger.info("Model loaded")
    if _IMPUTER is None and Path(imputer_path).exists():
        _IMPUTER = load_joblib_safe(imputer_path)
        logger.info("Imputer loaded")
    if _SCALER is None and Path(scaler_path).exists():
        _SCALER = load_joblib_safe(scaler_path)
        logger.info("Scaler loaded")
    if _FEATURES is None and Path(features_path).exists():
        _FEATURES = load_features(features_path)
        logger.info("Features loaded")
    return _MODEL, _IMPUTER, _SCALER, _FEATURES

def predict(rows, model_path, imputer_path, scaler_path, features_path):
    model, imputer, scaler, features = _load_artifacts(model_path, imputer_path, scaler_path, features_path)
    if model is None:
        raise RuntimeError("Model missing")
    X = preprocess_rows(rows, features, imputer, scaler)
    preds = model.predict(X).tolist()
    probs = model.predict_proba(X).tolist()
    return preds, probs
