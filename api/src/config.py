import os

def get_env(name, default=None, required=False):
    val = os.getenv(name, default)
    if required and not val:
        raise EnvironmentError(f"Missing env var: {name}")
    return val

MODEL_URL = get_env("MODEL_URL", None)
MODEL_PATH = get_env("MODEL_PATH", "api/models/xgb_model.joblib")
SCALER_PATH = get_env("SCALER_PATH", "api/models/scaler.joblib")
IMPUTER_PATH = get_env("IMPUTER_PATH", "api/models/imputer.joblib")
ALLOWED_ORIGINS = get_env("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS_LIST = [s.strip() for s in ALLOWED_ORIGINS.split(",") if s.strip()]
MODEL_VERSION = get_env("MODEL_VERSION", "v1.0")
PROVENANCE_PATH = get_env("PROVENANCE_PATH", "api/models/training_provenance.json")
SHAP_ENABLED = get_env("SHAP_ENABLED", "false").lower() in ("1","true","yes")
RELOAD_SECRET = get_env("RELOAD_SECRET", "")
PORT = int(get_env("PORT", "8000"))
