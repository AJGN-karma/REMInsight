"""
Optuna subject-wise hyperparameter tuning. Saves best_params.json to artifacts.
Note: runs subject-wise CV internally; controlled by train_config.yaml optuna section.
"""
import yaml, json
from pathlib import Path
import numpy as np, pandas as pd, random
from sklearn.model_selection import GroupKFold
import xgboost as xgb
import optuna, joblib
from .utils import logger

ROOT = Path(__file__).resolve().parent
CFG = yaml.safe_load(open(ROOT.parent / "configs" / "train_config.yaml"))
ARTIFACTS = (ROOT.parent / "models").resolve() / "artifacts"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
SEED = CFG.get("seed", 42)
random.seed(SEED)

def load_xy_groups():
    X = pd.read_parquet(ARTIFACTS / "X.parquet")
    y = pd.read_parquet(ARTIFACTS / "y.parquet").squeeze()
    groups = X["subject_id"].astype(str).values if "subject_id" in X.columns else (np.arange(len(X)) % 100)
    if "subject_id" in X.columns:
        X = X.drop(columns=["subject_id"])
    return X, y, groups

def objective(trial):
    X, y, groups = load_xy_groups()
    n_splits = CFG["training"].get("n_splits", 5)
    gkf = GroupKFold(n_splits=n_splits)
    param = {
        "objective": "binary:logistic",
        "eval_metric": "auc",
        "use_label_encoder": False,
        "seed": SEED,
        "verbosity": 0,
        "n_estimators": trial.suggest_int("n_estimators", 50, 500),
        "learning_rate": trial.suggest_loguniform("learning_rate", 1e-3, 0.2),
        "max_depth": trial.suggest_int("max_depth", 3, 10),
        "subsample": trial.suggest_float("subsample", 0.5, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
        "reg_alpha": trial.suggest_loguniform("reg_alpha", 1e-8, 10.0),
        "reg_lambda": trial.suggest_loguniform("reg_lambda", 1e-8, 10.0),
    }
    scores = []
    for train_idx, val_idx in gkf.split(X, y, groups):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
        dtrain = xgb.DMatrix(X_train, label=y_train)
        dval = xgb.DMatrix(X_val, label=y_val)
        bst = xgb.train(param, dtrain, num_boost_round=param["n_estimators"], evals=[(dval, "val")], verbose_eval=False, early_stopping_rounds=CFG["training"].get("early_stopping_rounds",50))
        preds = bst.predict(dval, ntree_limit=getattr(bst, "best_ntree_limit", None))
        try:
            auc = float(np.nan if len(set(y_val)) != 2 else float(roc_auc_score(y_val, preds)))
        except Exception:
            from sklearn.metrics import roc_auc_score
            auc = float(roc_auc_score(y_val, preds))
        scores.append(auc)
    return float(np.mean(scores))

def main():
    study = optuna.create_study(direction=CFG["training"]["optuna"]["direction"])
    n_trials = CFG["training"]["optuna"].get("n_trials", 50)
    study.optimize(objective, n_trials=n_trials, timeout=CFG["training"]["optuna"].get("timeout", None))
    best = study.best_params
    json.dump(best, open(ARTIFACTS / "best_params.json", "w"), indent=2)
    logger.info("Saved best Optuna params to %s", ARTIFACTS / "best_params.json")
    return best

if __name__ == "__main__":
    main()
