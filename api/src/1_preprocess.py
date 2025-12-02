"""
Preprocessing: missing value strategy, outlier removal, save imputer/scaler/features.json in models/artifacts.
"""
import yaml, joblib, numpy as np, pandas as pd, math, random
from pathlib import Path
from sklearn.impute import KNNImputer, SimpleImputer
from sklearn.preprocessing import StandardScaler
from .utils import logger

ROOT = Path(__file__).resolve().parent
CFG = yaml.safe_load(open(ROOT.parent / "configs" / "train_config.yaml"))
SEED = CFG.get("seed", 42)
np.random.seed(SEED)
random.seed(SEED)

DATA_DIR = ROOT.parent / "data"
TRAIN_CSV = Path(CFG["data"]["train_csv"]).resolve()
PROCESSED_OUT = DATA_DIR / "processed.csv"
ARTIFACTS_DIR = (ROOT.parent / "models").resolve() / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

def drop_impossible_values(df):
    if "tst_min" in df.columns:
        df = df[(df["tst_min"].notna()) & (df["tst_min"] >= 0) & (df["tst_min"] <= 1440)]
    return df

def remove_outliers_iqr(df, features, multiplier=1.5):
    df2 = df.copy()
    for f in features:
        if df2[f].dtype.kind in 'biufc':
            q1 = df2[f].quantile(0.25)
            q3 = df2[f].quantile(0.75)
            iqr = q3 - q1
            if math.isnan(iqr) or iqr == 0:
                continue
            lo = q1 - multiplier * iqr
            hi = q3 + multiplier * iqr
            df2 = df2[(df2[f] >= lo) & (df2[f] <= hi)]
    return df2

def build_imputer(df, method="median", knn_k=5):
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if method == "median":
        imputer = SimpleImputer(strategy="median")
    else:
        imputer = KNNImputer(n_neighbors=knn_k)
    imputer.fit(df[num_cols])
    return imputer, num_cols

def main():
    if not TRAIN_CSV.exists():
        raise FileNotFoundError(f"{TRAIN_CSV} not found. Place balanced training CSV at this path.")
    df = pd.read_csv(TRAIN_CSV)
    df.columns = [c.strip().lower() for c in df.columns]
    df = drop_impossible_values(df)
    label_candidates = [c for c in df.columns if c in ("label","label_risk","target")]
    if not label_candidates:
        raise ValueError("Label column missing. Rename your label column to 'label' or 'label_risk' or 'target'.")
    label_col = label_candidates[0]
    feature_cols = [c for c in df.columns if c not in (label_col, "subject_id", "session_id", "timestamp", "id")]

    outlier_method = CFG["preprocessing"].get("outlier_removal", "iqr")
    if outlier_method == "iqr":
        df = remove_outliers_iqr(df, feature_cols, multiplier=CFG["preprocessing"].get("iqr_multiplier",1.5))

    imputation = CFG["preprocessing"].get("imputation", "median")
    imputer, num_cols = build_imputer(df[feature_cols], method=imputation, knn_k=CFG["preprocessing"].get("knn_neighbors",5))
    df[num_cols] = pd.DataFrame(imputer.transform(df[num_cols]), columns=num_cols, index=df.index)
    joblib.dump(imputer, ARTIFACTS_DIR / "imputer.joblib")
    logger.info("Saved imputer to %s", ARTIFACTS_DIR / "imputer.joblib")

    scaler = StandardScaler()
    scaler.fit(df[num_cols])
    joblib.dump(scaler, ARTIFACTS_DIR / "scaler.joblib")
    logger.info("Saved scaler to %s", ARTIFACTS_DIR / "scaler.joblib")

    df.to_csv(PROCESSED_OUT, index=False)
    logger.info("Saved processed CSV to %s shape=%s", PROCESSED_OUT, df.shape)

    import json
    json.dump(num_cols, open(ARTIFACTS_DIR / "features.json","w"), indent=2)
    logger.info("Saved features.json with %d features", len(num_cols))

if __name__ == "__main__":
    main()
