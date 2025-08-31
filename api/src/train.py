from __future__ import annotations
import argparse, json, os, time
from typing import Dict, Any
import joblib
import numpy as np
import optuna
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix, roc_auc_score, brier_score_loss
from xgboost import XGBClassifier

from .data_utils import load_csv, validate_schema, feature_engineer, split_by_subject, build_xy, save_feature_list
from .utils import save_json, now_iso, sha256_of_file

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--config", required=True)
    p.add_argument("--data", required=True, help="training csv (balanced)")
    p.add_argument("--val", required=True, help="evaluation csv (imbalanced)")
    p.add_argument("--out", required=True, help="models output dir")
    return p.parse_args()

def load_config(path: str) -> Dict[str, Any]:
    import yaml
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def train_main():
    args = parse_args()
    cfg = load_config(args.config)
    os.makedirs(args.out, exist_ok=True)

    seed = cfg.get("seed", 42)
    target = cfg["target"]
    subject_col = cfg["subject_id_col"]
    req_cols = cfg["required_columns"]
    num_feats = cfg["numeric_features"]
    cat_feats = cfg["categorical_features"]
    derived = cfg.get("derived_features", [])

    # Load
    df_train_raw = load_csv(args.data)
    df_eval_raw  = load_csv(args.val)

    # Validate
    validate_schema(df_train_raw, req_cols)
    validate_schema(df_eval_raw, req_cols)

    # FE
    df_train = feature_engineer(df_train_raw)
    df_eval  = feature_engineer(df_eval_raw)

    # Subject-wise split inside TRAIN set (train/val/test), but we already pass external eval set too.
    tr, va, te = split_by_subject(
        df_train, subject_col, cfg["test_size"], cfg["val_size"], target, seed
    )

    # Build XY for internal splits
    X_tr, y_tr, feats = build_xy(tr, num_feats + derived, cat_feats, target)
    X_va, y_va, _     = build_xy(va, num_feats + derived, cat_feats, target)
    X_te, y_te, _     = build_xy(te, num_feats + derived, cat_feats, target)

    # Standardize numerics only (fit on train)
    # Note: we standardize the subset of features that match numeric columns within X after one-hot
    scaler = StandardScaler(with_mean=True, with_std=True)
    numeric_cols_in_X = [c for c in X_tr.columns if any(c.startswith(f) for f in num_feats + derived)]
    scaler.fit(X_tr[numeric_cols_in_X])
    for X in (X_tr, X_va, X_te):
        X.loc[:, numeric_cols_in_X] = scaler.transform(X[numeric_cols_in_X])

    # XGBoost
    xgb_params = cfg["xgb_params"]
    model = XGBClassifier(**xgb_params)

    # Early stopping uses eval_set
    model.fit(
        X_tr, y_tr,
        eval_set=[(X_va, y_va)],
        verbose=False,
        early_stopping_rounds=cfg.get("early_stopping_rounds", 30)
    )

    # Internal eval
    def eval_block(X, y):
        p = model.predict(X)
        proba = model.predict_proba(X)
        out = {
            "accuracy": float(accuracy_score(y, p)),
            "f1_macro": float(f1_score(y, p, average="macro")),
            "report": classification_report(y, p, output_dict=True),
            "confusion_matrix": confusion_matrix(y, p).tolist(),
            "roc_auc_ovr": float(roc_auc_score(y, proba, multi_class="ovr")),
            "brier_score": float(brier_score_loss((y==2).astype(int), proba[:,2])) # reference class 2
        }
        return out

    tr_metrics = eval_block(X_tr, y_tr)
    va_metrics = eval_block(X_va, y_va)
    te_metrics = eval_block(X_te, y_te)

    # External eval on provided imbalanced dataset
    X_ev, y_ev, _ = build_xy(df_eval, num_feats + derived, cat_feats, target)
    # align columns
    X_ev = X_ev.reindex(columns=X_tr.columns, fill_value=0)
    X_ev.loc[:, numeric_cols_in_X] = scaler.transform(X_ev[numeric_cols_in_X])
    ev_metrics = eval_block(X_ev, y_ev)

    # Save artifacts
    model_path = os.path.join(args.out, "xgb_model.joblib")
    scaler_path = os.path.join(args.out, "scaler.joblib")
    feat_path = os.path.join(args.out, "feature_list.json")

    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    save_feature_list(list(X_tr.columns), feat_path)

    # Summaries
    training_summary = {
        "generated_at": now_iso(),
        "n_train": int(len(X_tr)),
        "n_val": int(len(X_va)),
        "n_test": int(len(X_te)),
        "features": list(X_tr.columns),
        "internal": {"train": tr_metrics, "val": va_metrics, "test": te_metrics},
        "external_eval_on_imbalanced": ev_metrics,
        "xgb_params": xgb_params,
        "best_ntree_limit": getattr(model, "best_ntree_limit", None),
    }
    save_json(training_summary, os.path.join(args.out, "training_summary.json"))

    # Provenance
    prov = {
        "seed": seed,
        "python": os.sys.version,
        "numpy": np.__version__,
        "pandas": pd.__version__,
        "sklearn": "1.4.2",
        "xgboost": "2.1.4",
        "model_sha256": sha256_of_file(model_path)
    }
    save_json(prov, os.path.join(args.out, "training_provenance.json"))

if __name__ == "__main__":
    train_main()
