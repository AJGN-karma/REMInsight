from __future__ import annotations
import json
from dataclasses import dataclass
from typing import List, Tuple, Dict, Any
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

RANDOM_SEED = 42

@dataclass
class SchemaRanges:
    psqi_item_min: int = 0
    psqi_item_max: int = 3
    psqi_global_min: int = 0
    psqi_global_max: int = 21
    rem_latency_min: int = 5
    rem_latency_max: int = 600
    artifact_pct_min: float = 0.0
    artifact_pct_max: float = 100.0
    rem_pct_min: float = 0.0
    rem_pct_max: float = 100.0  # if stored as percentage; else 0..1 tolerated below

def load_csv(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    return df

def validate_schema(df: pd.DataFrame, required_columns: List[str]) -> None:
    missing = [c for c in required_columns if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Basic ranges
    rng = SchemaRanges()
    for c in [f"psqi_c{i}" for i in range(1, 8)]:
        if ((df[c] < rng.psqi_item_min) | (df[c] > rng.psqi_item_max)).any():
            raise ValueError(f"Column {c} has values outside 0..3")
    if "psqi_global" in df.columns:
        if ((df["psqi_global"] < rng.psqi_global_min) | (df["psqi_global"] > rng.psqi_global_max)).any():
            raise ValueError("psqi_global out of 0..21")

    if "REM_latency_min" in df.columns:
        if ((df["REM_latency_min"] < rng.rem_latency_min) | (df["REM_latency_min"] > rng.rem_latency_max)).any():
            raise ValueError("REM_latency_min out of 5..600")

    if "artifact_pct" in df.columns:
        if ((df["artifact_pct"] < rng.artifact_pct_min) | (df["artifact_pct"] > rng.artifact_pct_max)).any():
            raise ValueError("artifact_pct out of 0..100")

    # REM_pct may be 0..1 or 0..100; clip later in feature_engineer

def feature_engineer(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()

    # Ensure psqi_global present
    if "psqi_global" not in out.columns:
        out["psqi_global"] = sum(out[f"psqi_c{i}"] for i in range(1, 8))

    # Normalize REM_pct to 0..1 if looks like percent 0..100
    if out["REM_pct"].max() > 1.5:
        out["REM_pct"] = out["REM_pct"] / 100.0

    # Sleep efficiency also normalize if >1.5
    if "sleep_efficiency_pct" in out.columns and out["sleep_efficiency_pct"].max() > 1.5:
        out["sleep_efficiency_pct"] = out["sleep_efficiency_pct"] / 100.0

    # Derived features
    out["psqi_rem_density_interaction"] = out["psqi_global"] * out["REM_density"].fillna(0)
    out["age_REM_latency_ratio"] = out["age"] / (out["REM_latency_min"].replace(0, np.nan))
    out["age_REM_latency_ratio"] = out["age_REM_latency_ratio"].fillna(out["age"])  # fallback if latency=0
    out["theta_alpha_ratio"] = out["mean_theta_pow"] / (out["mean_alpha_pow"].replace(0, np.nan))
    out["theta_alpha_ratio"] = out["theta_alpha_ratio"].fillna(0)

    # Clip numeric sanity
    out["artifact_pct"] = out["artifact_pct"].clip(0, 100)
    out["percent_epochs_missing"] = out["percent_epochs_missing"].clip(0, 100)
    out["REM_pct"] = out["REM_pct"].clip(0, 1)

    return out

def split_by_subject(
    df: pd.DataFrame,
    subject_col: str,
    test_size: float,
    val_size: float,
    stratify_col: str,
    seed: int = RANDOM_SEED
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    # Split subjects to avoid leakage
    subjects = df[subject_col].astype(str).unique()
    # For stratification, map subject -> majority label
    subj_labels = df.groupby(subject_col)[stratify_col].agg(lambda x: x.value_counts().index[0])
    subj_df = pd.DataFrame({subject_col: subjects}).merge(
        subj_labels.reset_index(), on=subject_col, how="left"
    )
    train_subj, test_subj = train_test_split(
        subj_df, test_size=test_size, stratify=subj_df[stratify_col], random_state=seed
    )
    # Recompute val split from train pool
    train_subj2, val_subj = train_test_split(
        train_subj, test_size=val_size/(1.0-test_size), stratify=train_subj[stratify_col], random_state=seed
    )

    def mask(df, subj_list):
        return df[df[subject_col].astype(str).isin(subj_list[subject_col].astype(str))].copy()

    train_df = mask(df, train_subj2)
    val_df = mask(df, val_subj)
    test_df = mask(df, test_subj)
    return train_df, val_df, test_df

def build_xy(
    df: pd.DataFrame,
    numeric_features: List[str],
    categorical_features: List[str],
    target: str
) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
    # One-hot encode categoricals
    df_enc = pd.get_dummies(df[numeric_features + categorical_features], drop_first=True)
    features = df_enc.columns.tolist()
    X = df_enc
    y = df[target].astype(int)
    return X, y, features

def save_feature_list(features: List[str], path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(features, f, indent=2)
