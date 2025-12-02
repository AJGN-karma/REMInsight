"""
Subject-wise GroupKFold CV training using XGBoost DMatrix + early stopping.
Saves best fold model into models/vTIMESTAMP/model.joblib and provenance.json.
"""
import yaml, json, joblib, random
from pathlib import Path
import numpy as np, pandas as pd
from sklearn.model_selection import GroupKFold
import xgboost as xgb
from sklearn.metrics import roc_auc_score, accuracy_score, f1_score, precision_score, recall_score, confusion_matrix
from datetime import datetime
from .utils import logger

ROOT = Path(__file__).resolve().parent
CFG = yaml.safe_load(open(ROOT.parent / "configs" / "train_config.yaml"))
SEED = CFG.get("seed", 42)
np.random.seed(SEED)
random.seed(SEED)

MODELS_DIR = (ROOT.parent / "models").resolve()
ARTIFACTS = MODELS_DIR / "artifacts"
X_FILE = ARTIFACTS / "X.parquet"
Y_FILE = ARTIFACTS / "y.parquet"

def load_data():
    if not X_FILE.exists() or not Y_FILE.exists():
        raise FileNotFoundError("Run feature engineering first.")
    X = pd.read_parquet(X_FILE)
    y = pd.read_parquet(Y_FILE).squeeze()
    if "subject_id" in X.columns:
        groups = X["subject_id"].astype(str).values
    else:
        groups = np.arange(len(X)) % 100
    return X, y, groups

def compute_scale_pos_weight(y):
    vals = np.bincount(y.astype(int))
    if len(vals) == 2 and vals[1] > 0:
        return float(vals[0]) / float(vals[1])
    return None

def train_cv():
    X, y, groups = load_data()
    nfolds = CFG["training"].get("n_splits", 5)
    gkf = GroupKFold(n_splits=nfolds)
    params = CFG["training"]["default_params"].copy()
    if params.get("scale_pos_weight", None) in (None, "null"):
        spw = compute_scale_pos_weight(y)
        if spw is not None:
            params["scale_pos_weight"] = spw

    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    fold_metrics = []
    fold_models = []

    fold = 0
    for train_idx, val_idx in gkf.split(X, y, groups):
        fold += 1
        X_train, X_val = X.iloc[train_idx].copy(), X.iloc[val_idx].copy()
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
        for col in ["subject_id"]:
            if col in X_train.columns:
                X_train = X_train.drop(columns=[col])
                X_val = X_val.drop(columns=[col])

        dtrain = xgb.DMatrix(X_train, label=y_train)
        dval = xgb.DMatrix(X_val, label=y_val)
        logger.info("Training fold %d/%d with params: %s", fold, nfolds, params)
        bst = xgb.train(
            params=params,
            dtrain=dtrain,
            num_boost_round=params.get("n_estimators", 500),
            evals=[(dtrain, "train"), (dval, "val")],
            early_stopping_rounds=CFG["training"].get("early_stopping_rounds", 50),
            verbose_eval=False
        )

        y_prob = bst.predict(dval, ntree_limit=getattr(bst, "best_ntree_limit", None))
        y_pred = (y_prob >= 0.5).astype(int)
        auc = float(roc_auc_score(y_val, y_prob)) if len(set(y_val)) == 2 else None
        acc = float(accuracy_score(y_val, y_pred))
        f1 = float(f1_score(y_val, y_pred, average='macro'))
        prec = float(precision_score(y_val, y_pred, average='macro', zero_division=0))
        rec = float(recall_score(y_val, y_pred, average='macro', zero_division=0))
        cm = confusion_matrix(y_val, y_pred).tolist()
        metrics = {"fold": fold, "auc": auc, "accuracy": acc, "f1_macro": f1, "precision": prec, "recall": rec, "confusion_matrix": cm, "best_ntree": int(getattr(bst, "best_ntree_limit", params.get("n_estimators")))}
        fold_metrics.append(metrics)
        fold_models.append((fold, bst))
        joblib.dump(bst, ARTIFACTS / f"model_fold{fold}.joblib")
        logger.info("Saved fold model to %s", ARTIFACTS / f"model_fold{fold}.joblib")

    # pick best fold (AUC preferred)
    def score_key(m):
        return (m["auc"] if m["auc"] is not None else m["f1_macro"])
    best = max(fold_metrics, key=score_key)
    selected_fold = best["fold"]
    selected_model = joblib.load(ARTIFACTS / f"model_fold{selected_fold}.joblib")

    ts = datetime.utcnow().strftime(CFG["artifacts"].get("timestamp_format", "%Y%m%dT%H%M%S"))
    version_name = f"{CFG['artifacts'].get('version_prefix','v')}{ts}"
    version_dir = MODELS_DIR / version_name
    version_dir.mkdir(parents=True, exist_ok=True)

    joblib.dump(selected_model, version_dir / "model.joblib")
    # copy artifacts
    for fname in ["scaler.joblib", "imputer.joblib", "features.json", "features_full.json"]:
        p = ARTIFACTS / fname
        if p.exists():
            (version_dir / fname).write_bytes(p.read_bytes())

    prov = {
        "model_version": version_name,
        "trained_on": datetime.utcnow().isoformat() + "Z",
        "dataset": {"n_total": int(len(X))},
        "hyperparameters": params,
        "metrics": fold_metrics
    }
    json.dump(prov, open(version_dir / "provenance.json", "w"), indent=2)
    logger.info("Exported version %s to %s", version_name, version_dir)
    return version_name, version_dir

if __name__ == "__main__":
    train_cv()
