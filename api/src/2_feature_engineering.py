"""
Generate rolling stats, diffs, optional polynomial features.
Saves X.parquet, y.parquet, features_full.json to models/artifacts.
"""
import yaml, json
from pathlib import Path
import pandas as pd, numpy as np
from sklearn.preprocessing import PolynomialFeatures
from .utils import logger

ROOT = Path(__file__).resolve().parent
CFG = yaml.safe_load(open(ROOT.parent / "configs" / "train_config.yaml"))
DATA_DIR = ROOT.parent / "data"
PROCESSED_IN = DATA_DIR / "processed.csv"
ARTIFACTS = (ROOT.parent / "models").resolve() / "artifacts"
ARTIFACTS.mkdir(parents=True, exist_ok=True)

def rolling_stats(df, cols, windows=[3,5]):
    df2 = df.copy()
    if "subject_id" in df.columns:
        for w in windows:
            for c in cols:
                df2[f"{c}_roll{w}_mean"] = df2.groupby("subject_id")[c].rolling(window=w, min_periods=1).mean().reset_index(level=0, drop=True)
                df2[f"{c}_roll{w}_std"] = df2.groupby("subject_id")[c].rolling(window=w, min_periods=1).std().fillna(0).reset_index(level=0, drop=True)
    return df2

def poly_features(df, cols, degree=2):
    pf = PolynomialFeatures(degree=degree, include_bias=False)
    arr = pf.fit_transform(df[cols].fillna(0).values)
    names = pf.get_feature_names_out(cols)
    return pd.DataFrame(arr, columns=names, index=df.index)

def main():
    if not PROCESSED_IN.exists():
        raise FileNotFoundError("Run preprocessing first (processed.csv).")
    df = pd.read_csv(PROCESSED_IN)
    df.columns = [c.strip().lower() for c in df.columns]
    label_candidates = [c for c in df.columns if c in ("label","label_risk","target")]
    if not label_candidates:
        raise ValueError("Label missing.")
    label_col = label_candidates[0]

    feat_cols = json.load(open(ARTIFACTS / "features.json"))
    feat_cols = [c for c in feat_cols if c in df.columns]

    roll_windows = CFG["feature_engineering"].get("rolling_windows", [])
    if roll_windows and "subject_id" in df.columns:
        df = rolling_stats(df, feat_cols, windows=roll_windows)

    new_feats = [c for c in df.columns if c not in ("subject_id", label_col, "session_id", "timestamp", "id")]

    degree = CFG["feature_engineering"].get("poly_degree", 0)
    if degree and degree > 1:
        pf_df = poly_features(df, feat_cols, degree=degree)
        df = pd.concat([df.reset_index(drop=True), pf_df.reset_index(drop=True)], axis=1)
        new_feats += list(pf_df.columns)

    X = df[new_feats]
    y = df[label_col]
    X.to_parquet(ARTIFACTS / "X.parquet", index=False)
    y.to_parquet(ARTIFACTS / "y.parquet", index=False)
    json.dump(new_feats, open(ARTIFACTS / "features_full.json","w"), indent=2)
    logger.info("Saved engineered features X.parquet and y.parquet and features_full.json to %s", ARTIFACTS)

if __name__ == "__main__":
    main()
