# api/src/train.py
"""
Training pipeline (XGBoost-only). Produces artifacts in api/models/
Run: python api/src/train.py --config api/configs/train_config.yaml
"""
import argparse, json, time, os
from pathlib import Path
from collections import defaultdict, Counter

import numpy as np
import pandas as pd
import joblib
import yaml
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, StratifiedShuffleSplit
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import xgboost as xgb

try:
    import optuna
    OPTUNA = True
except Exception:
    OPTUNA = False

try:
    import shap
    SHAP_AVAILABLE = True
except Exception:
    SHAP_AVAILABLE = False

from .data_utils import read_csv, validate_columns
from .feature_engineering import ensure_derived

def read_config(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)

def ensure_dir(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)

def subjectwise_split(subject_ids, labels, test_size=0.15, val_size=0.15, seed=42):
    subj_to_labels = defaultdict(list)
    for s,l in zip(subject_ids, labels):
        subj_to_labels[s].append(l)
    unique_subjects = list(subj_to_labels.keys())
    subj_label_mode = [Counter(subj_to_labels[s]).most_common(1)[0][0] for s in unique_subjects]

    sss = StratifiedShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
    subj_idx = list(range(len(unique_subjects)))
    train_temp_subj_idx, test_subj_idx = next(sss.split(subj_idx, subj_label_mode))

    train_temp_subjects = [unique_subjects[i] for i in train_temp_subj_idx]
    train_temp_labels = [subj_label_mode[i] for i in train_temp_subj_idx]

    sss2 = StratifiedShuffleSplit(n_splits=1, test_size=val_size/(1-test_size), random_state=seed)
    train_subj_idx, val_subj_idx = next(sss2.split(list(range(len(train_temp_subjects))), train_temp_labels))

    train_subjects = set(train_temp_subjects[i] for i in train_subj_idx)
    val_subjects = set(train_temp_subjects[i] for i in val_subj_idx)
    test_subjects = set(unique_subjects[i] for i in test_subj_idx)

    train_idx = [i for i,s in enumerate(subject_ids) if s in train_subjects]
    val_idx = [i for i,s in enumerate(subject_ids) if s in val_subjects]
    test_idx = [i for i,s in enumerate(subject_ids) if s in test_subjects]
    return {"train_idx": train_idx, "val_idx": val_idx, "test_idx": test_idx}

def compute_metrics(y_true, y_pred, y_proba=None):
    res = {}
    res["accuracy"] = float(accuracy_score(y_true, y_pred))
    res["precision"] = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    res["recall"] = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    res["f1_score"] = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    if y_proba is not None:
        try:
            res["roc_auc_ovr"] = float(roc_auc_score(pd.get_dummies(y_true), y_proba, average="macro", multi_class="ovr"))
        except Exception:
            res["roc_auc_ovr"] = None
    res["confusion_matrix"] = confusion_matrix(y_true, y_pred).tolist()
    return res

def train_xgb(X_train, y_train, X_val, y_val, params, early_stopping):
    model = xgb.XGBClassifier(**params, use_label_encoder=False, eval_metric="mlogloss")
    model.fit(X_train, y_train, eval_set=[(X_train,y_train),(X_val,y_val)], early_stopping_rounds=early_stopping, verbose=False)
    return model

def objective_optuna(trial, X, y, cfg):
    param = {
        "max_depth": trial.suggest_int("max_depth", 3, 10),
        "learning_rate": trial.suggest_loguniform("learning_rate", 0.01, 0.2),
        "n_estimators": trial.suggest_int("n_estimators", 100, 800),
        "subsample": trial.suggest_float("subsample", 0.6, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
        "reg_alpha": trial.suggest_float("reg_alpha", 0.0, 1.0),
        "reg_lambda": trial.suggest_float("reg_lambda", 0.0, 5.0),
        "random_state": cfg.get("seed",42),
        "objective": "multi:softprob",
        "num_class": cfg["xgb_params"]["num_class"],
        "tree_method": "hist"
    }
    skf = StratifiedKFold(n_splits=3, shuffle=True, random_state=cfg.get("seed",42))
    aucs = []
    for tr,va in skf.split(X,y):
        clf = xgb.XGBClassifier(**param, use_label_encoder=False, eval_metric="mlogloss")
        clf.fit(X[tr], y[tr], eval_set=[(X[tr],y[tr]), (X[va], y[va])], early_stopping_rounds=cfg.get("early_stopping_rounds",30), verbose=False)
        proba = clf.predict_proba(X[va])
        try:
            auc = roc_auc_score(pd.get_dummies(y[va]), proba, average="macro", multi_class="ovr")
        except Exception:
            auc = 0.0
        aucs.append(auc)
    return float(np.mean(aucs))

def main(cfg_path):
    t0 = time.time()
    cfg = read_config(cfg_path)
    train_csv = cfg["data_paths"]["train_csv"]
    val_csv = cfg["data_paths"]["val_csv"]
    model_out = cfg["data_paths"]["model_out"]
    scaler_out = cfg["data_paths"]["scaler_out"]
    imputer_out = cfg["data_paths"]["imputer_out"]
    features_out = cfg["data_paths"]["features_out"]
    summary_out = cfg["data_paths"]["training_summary_out"]
    eval_out = cfg["data_paths"]["evaluation_report_out"]

    df_train = read_csv(train_csv)
    df_val = read_csv(val_csv)

    # Validate columns
    validate_columns(df_train, cfg["required_columns"])
    validate_columns(df_val, cfg["required_columns"])

    # Combine for consistent preprocessing
    df_all = pd.concat([df_train, df_val], ignore_index=True)
    df_all = ensure_derived(df_all)
    features = cfg["feature_columns"]
    # Save features
    ensure_dir(features_out)
    with open(features_out, "w") as f:
        json.dump(features, f, indent=2)

    X_all = df_all[features].values.astype(float)
    y_all = df_all[cfg["target"]].values
    subj_all = df_all[cfg.get("subject_id_col","subject_id")].values

    splits = subjectwise_split(subj_all, y_all, test_size=cfg.get("test_size",0.15), val_size=cfg.get("val_size",0.15), seed=cfg.get("seed",42))
    train_idx, val_idx, test_idx = splits["train_idx"], splits["val_idx"], splits["test_idx"]

    X_train, y_train = X_all[train_idx], y_all[train_idx]
    X_val, y_val = X_all[val_idx], y_all[val_idx]
    X_test, y_test = X_all[test_idx], y_all[test_idx]

    # Imputer & scaler (fit on train only)
    imputer = SimpleImputer(strategy="median")
    X_train = imputer.fit_transform(X_train)
    X_val = imputer.transform(X_val)
    X_test = imputer.transform(X_test)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_val = scaler.transform(X_val)
    X_test = scaler.transform(X_test)

    tuned = cfg.get("xgb_params", {}).copy()
    if cfg.get("use_optuna", True) and OPTUNA:
        study = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=cfg.get("seed",42)))
        study.optimize(lambda t: objective_optuna(t, X_train, y_train, cfg), n_trials=cfg.get("optuna_trials",20))
        best = study.best_params
        tuned.update({
            "max_depth": best["max_depth"],
            "learning_rate": best["learning_rate"],
            "n_estimators": int(best["n_estimators"]),
            "subsample": best["subsample"],
            "colsample_bytree": best["colsample_bytree"],
            "reg_alpha": float(best["reg_alpha"]),
            "reg_lambda": float(best["reg_lambda"]),
            "tree_method": "hist",
            "random_state": cfg.get("seed",42),
            "objective": "multi:softprob",
            "num_class": cfg["xgb_params"]["num_class"],
        })
    else:
        tuned.update(cfg.get("xgb_params", {}))

    model = train_xgb(X_train, y_train, X_val, y_val, tuned, cfg.get("early_stopping_rounds",30))

    # Evaluate
    ytr_pred = model.predict(X_train)
    ytr_proba = model.predict_proba(X_train)
    yv_pred = model.predict(X_val)
    yv_proba = model.predict_proba(X_val)
    yt_pred = model.predict(X_test)
    yt_proba = model.predict_proba(X_test)

    metrics = {
        "train": compute_metrics(y_train, ytr_pred, ytr_proba),
        "val": compute_metrics(y_val, yv_pred, yv_proba),
        "test": compute_metrics(y_test, yt_pred, yt_proba),
        "counts": {"total": len(df_all), "train": len(train_idx), "val": len(val_idx), "test": len(test_idx)},
        "feature_count": len(features),
        "duration_seconds": int(time.time()-t0)
    }

    # Save artifacts
    joblib.dump(model, model_out)
    joblib.dump(scaler, scaler_out)
    joblib.dump(imputer, imputer_out)
    with open(summary_out, "w") as f:
        json.dump({"config": cfg, "metrics": metrics}, f, indent=2)
    with open(eval_out, "w") as f:
        json.dump(metrics, f, indent=2)

    if SHAP_AVAILABLE:
        try:
            expl = shap.TreeExplainer(model)
            n = min(200, X_test.shape[0])
            idx = np.random.RandomState(cfg.get("seed",42)).choice(range(X_test.shape[0]), size=n, replace=False)
            Xs = X_test[idx]
            leaf_shap = expl.shap_values(Xs)
            mean_abs = np.mean(np.abs(leaf_shap), axis=(0,1)) if isinstance(leaf_shap, list) else np.mean(np.abs(leaf_shap), axis=0)
            feat_imp = sorted(list(zip(features, mean_abs.tolist())), key=lambda x:x[1], reverse=True)
            with open(Path(model_out).parent.joinpath("shap_feature_importance.json"), "w") as f:
                json.dump(feat_imp, f, indent=2)
        except Exception as e:
            print("shap error:", e)

    print("Training complete. Artifacts saved.")
    print(json.dumps(metrics, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default="../configs/train_config.yaml")
    args = parser.parse_args()
    main(args.config)
