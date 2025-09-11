from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Optional, Dict, Any

import numpy as np
import pandas as pd
import yaml
from joblib import dump
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

# >>> Our data helpers (you already created src/data_utils.py)
from src.data_utils import (
    load_csv,
    ensure_psqi_global,
    validate_schema,
    feature_engineer,
)

RNG_SEED = 42


def load_config(path: Optional[str]) -> Dict[str, Any]:
    """Load YAML config if provided; otherwise return defaults."""
    default = {
        "model": {
            "n_estimators": 300,
            "max_depth": 6,
            "learning_rate": 0.05,
            "subsample": 0.9,
            "colsample_bytree": 0.9,
            "reg_lambda": 1.0,
            "reg_alpha": 0.0,
            "tree_method": "hist",  # fast
            "random_state": RNG_SEED,
        }
    }
    if not path:
        return default
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    # shallow-merge
    if "model" in cfg:
        default["model"].update(cfg["model"] or {})
    return default


def build_model(model_cfg: Dict[str, Any]) -> XGBClassifier:
    """Create an XGBClassifier for 3-class risk classification (0/1/2)."""
    return XGBClassifier(
        n_estimators=model_cfg.get("n_estimators", 300),
        max_depth=model_cfg.get("max_depth", 6),
        learning_rate=model_cfg.get("learning_rate", 0.05),
        subsample=model_cfg.get("subsample", 0.9),
        colsample_bytree=model_cfg.get("colsample_bytree", 0.9),
        reg_lambda=model_cfg.get("reg_lambda", 1.0),
        reg_alpha=model_cfg.get("reg_alpha", 0.0),
        tree_method=model_cfg.get("tree_method", "hist"),
        objective="multi:softprob",   # multiclass probabilities
        num_class=3,
        random_state=model_cfg.get("random_state", RNG_SEED),
        n_jobs=0,
    )


def prepare_frame(path: str) -> tuple[pd.DataFrame, list[str]]:
    """
    READ + ENSURE + VALIDATE + FEATURE ENGINEER
    This returns a ready-to-use DataFrame and the model feature list.

    IMPORTANT: This is the block that was previously described in “replace your reads” and
    “call feature engineering”. It’s now consolidated here.
    """
    # (1) Load CSV with normalized headers
    df_raw = load_csv(path)

    # (2) Ensure psqi_global exists (derive from psqi_c1..psqi_c7 if missing)
    df_raw = ensure_psqi_global(df_raw)

    # (3) Validate schema + ranges. Keep the returned frame!
    df_val = validate_schema(df_raw, required_columns=None)

    # (4) Add derived features + get the feature list used for ML
    df_fe, feat_list = feature_engineer(df_val)

    return df_fe, feat_list


def make_Xy(df: pd.DataFrame, features: list[str]):
    """
    Build X (features) and y (labels) numpy arrays.
    NOTE: This is where we “create X/y”.
    """
    X = df[features].values
    y = df["label_risk"].astype(int).values
    return X, y


def impute_and_scale(train_X: np.ndarray, val_X: Optional[np.ndarray]):
    """Fit imputer+scaler on train, transform both."""
    imputer = SimpleImputer(strategy="median")
    scaler = StandardScaler()

    train_X_imp = imputer.fit_transform(train_X)
    train_X_scl = scaler.fit_transform(train_X_imp)

    val_X_scl = None
    if val_X is not None:
        val_X_imp = imputer.transform(val_X)
        val_X_scl = scaler.transform(val_X_imp)

    return train_X_scl, val_X_scl, imputer, scaler


def evaluate(y_true: np.ndarray, y_pred: np.ndarray, y_prob: Optional[np.ndarray] = None) -> Dict[str, Any]:
    """Compute key metrics for reporting."""
    out = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "f1_macro": float(f1_score(y_true, y_pred, average="macro")),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
        "classification_report": classification_report(y_true, y_pred, output_dict=True),
    }
    if y_prob is not None:
        # you can add more prob-based metrics later (e.g., AUC per class)
        pass
    return out


def save_artifacts(out_dir: Path,
                   model: XGBClassifier,
                   imputer: SimpleImputer,
                   scaler: StandardScaler,
                   features: list[str],
                   train_report: Dict[str, Any],
                   val_report: Optional[Dict[str, Any]]):
    """Save model, preprocessing, features, and reports to disk."""
    out_dir.mkdir(parents=True, exist_ok=True)

    dump(model, out_dir / "xgb_model.joblib")
    dump(imputer, out_dir / "imputer.joblib")
    dump(scaler, out_dir / "scaler.joblib")

    (out_dir / "features.json").write_text(json.dumps(features, indent=2))

    all_reports = {"train": train_report}
    if val_report is not None:
        all_reports["val"] = val_report
    (out_dir / "evaluation_report.json").write_text(json.dumps(all_reports, indent=2))

    # simple training summary
    (out_dir / "training_summary.json").write_text(json.dumps({
        "model_type": "XGBClassifier",
        "artifacts": {
            "model": "xgb_model.joblib",
            "imputer": "imputer.joblib",
            "scaler": "scaler.joblib",
            "features": "features.json",
            "evaluation_report": "evaluation_report.json",
        }
    }, indent=2))

    print(f"[OK] Saved artifacts to: {out_dir.resolve()}")


def train_main():
    parser = argparse.ArgumentParser(description="Train REMInsight classifier")
    parser.add_argument("--config", type=str, default=None, help="YAML config file")
    parser.add_argument("--data", type=str, required=True, help="Training CSV")
    parser.add_argument("--val", type=str, default=None, help="External validation CSV (optional but recommended)")
    parser.add_argument("--out", type=str, required=True, help="Directory to save model artifacts")
    args = parser.parse_args()

    cfg = load_config(args.config)
    model_cfg = cfg["model"]

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    # -----------------------------
    #   TRAIN PREP
    # -----------------------------
    print("[INFO] Loading + preparing TRAIN data...")
    df_train_fe, feat_list = prepare_frame(args.data)
    X_train, y_train = make_Xy(df_train_fe, feat_list)

    # -----------------------------
    #   VAL PREP (optional)
    # -----------------------------
    X_val = y_val = df_val_fe = None
    if args.val:
        print("[INFO] Loading + preparing VAL data...")
        df_val_fe, _ = prepare_frame(args.val)
        # Important: align columns to training feature list to avoid shape mismatch
        df_val_fe = df_val_fe.reindex(columns=feat_list + [c for c in df_val_fe.columns if c not in feat_list])
        X_val, y_val = make_Xy(df_val_fe, feat_list)

    # -----------------------------
    #   PREPROCESS (impute + scale)
    # -----------------------------
    X_train_scl, X_val_scl, imputer, scaler = impute_and_scale(X_train, X_val)

    # -----------------------------
    #   MODEL
    # -----------------------------
    print("[INFO] Building model...")
    model = build_model(model_cfg)

    print("[INFO] Training model...")
    model.fit(X_train_scl, y_train)

    # -----------------------------
    #   EVALUATION
    # -----------------------------
    print("[INFO] Evaluating on TRAIN...")
    train_pred = model.predict(X_train_scl)
    train_prob = model.predict_proba(X_train_scl)
    train_report = evaluate(y_train, train_pred, train_prob)
    print(f"  Train acc={train_report['accuracy']:.3f}  f1_macro={train_report['f1_macro']:.3f}")

    val_report = None
    if X_val_scl is not None:
        print("[INFO] Evaluating on VAL...")
        val_pred = model.predict(X_val_scl)
        val_prob = model.predict_proba(X_val_scl)
        val_report = evaluate(y_val, val_pred, val_prob)
        print(f"  Val   acc={val_report['accuracy']:.3f}  f1_macro={val_report['f1_macro']:.3f}")

    # -----------------------------
    #   SAVE
    # -----------------------------
    save_artifacts(
        out_dir=out_dir,
        model=model,
        imputer=imputer,
        scaler=scaler,
        features=feat_list,
        train_report=train_report,
        val_report=val_report,
    )


if __name__ == "__main__":
    train_main()
