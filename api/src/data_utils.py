from __future__ import annotations
import re
from typing import List, Optional, Tuple

import numpy as np
import pandas as pd


# ---------- small utilities ----------

def _read_csv_any(path: str) -> pd.DataFrame:
    """Read CSV, auto-detect delimiter if needed."""
    try:
        return pd.read_csv(path)
    except Exception:
        return pd.read_csv(path, sep=None, engine="python")


def _ci_lookup(df: pd.DataFrame, name: str) -> Optional[str]:
    """Case-insensitive exact match for a column name."""
    low = {c.lower(): c for c in df.columns}
    return low.get(name.lower())


def _ci_present(df: pd.DataFrame, name: str) -> bool:
    return _ci_lookup(df, name) is not None


def _to_numeric_safe(s: pd.Series) -> pd.Series:
    return pd.to_numeric(s, errors="coerce")


# ---------- public helpers used by train.py ----------

def load_csv(path: str) -> pd.DataFrame:
    """
    Load a CSV and do very light header cleanup (strip only).
    We keep the original case of your columns (e.g., 'TST_min').
    """
    df = _read_csv_any(path)
    df = df.rename(columns={c: str(c).strip() for c in df.columns})
    return df


def ensure_psqi_global(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ensure a column named exactly 'psqi_global' exists.
    If not found, derive it by summing PSQI components: psqi_c1..psqi_c7 (case-insensitive).
    """
    df = df.copy()

    # If there's already psqi_global (any case), normalize its exact name:
    existing = _ci_lookup(df, "psqi_global")
    if existing:
        if existing != "psqi_global":
            df.rename(columns={existing: "psqi_global"}, inplace=True)
        return df

    # Try to build from components (psqi_c1..psqi_c7), case-insensitive
    comps = []
    for i in range(1, 8):
        ci = _ci_lookup(df, f"psqi_c{i}")
        if ci:
            comps.append(ci)

    if len(comps) >= 3:  # be lenient; typical PSQI has 7 components, but accept partial
        df["psqi_global"] = df[comps].apply(_to_numeric_safe).sum(axis=1)
        return df

    # Could not build: leave as-is (validate_schema will complain if it is required)
    return df


def validate_schema(df: pd.DataFrame, required_columns: Optional[List[str]] = None) -> pd.DataFrame:
    """
    Validate that key columns exist (case-insensitive). If missing, raise with a helpful error.
    We do *not* rename other columns — only ensure psqi_global above.
    """
    req = required_columns or [
        "TST_min",
        "REM_total_min",
        "REM_latency_min",
        "REM_pct",
        "REM_density",
        "label_risk",
        "psqi_global",
    ]

    missing = [col for col in req if not _ci_present(df, col)]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    return df


def feature_engineer(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """
    Create a few safe derived features and return:
      - engineered dataframe
      - the *feature list* to feed the model

    Features are chosen automatically: all numeric columns except clear IDs/labels.
    """
    df = df.copy()

    # Helpful case-insensitive source columns
    c_tst  = _ci_lookup(df, "TST_min")
    c_remt = _ci_lookup(df, "REM_total_min")
    c_reml = _ci_lookup(df, "REM_latency_min")
    c_remp = _ci_lookup(df, "REM_pct")
    c_remd = _ci_lookup(df, "REM_density")

    # Numeric safe versions
    if c_tst:
        df[c_tst]  = _to_numeric_safe(df[c_tst])
    if c_remt:
        df[c_remt] = _to_numeric_safe(df[c_remt])
    if c_reml:
        df[c_reml] = _to_numeric_safe(df[c_reml])
    if c_remp:
        df[c_remp] = _to_numeric_safe(df[c_remp])
    if c_remd:
        df[c_remd] = _to_numeric_safe(df[c_remd])

    # Derived features (robust to zeros/NaNs)
    if c_tst and c_remt and c_tst in df.columns and c_remt in df.columns:
        df["rem_to_tst_ratio"] = df[c_remt] / df[c_tst].replace(0, np.nan)
    if c_tst and c_reml and c_tst in df.columns and c_reml in df.columns:
        df["rem_latency_ratio"] = df[c_reml] / df[c_tst].replace(0, np.nan)

    # Make sure label is integer-like
    if _ci_present(df, "label_risk"):
        lab = _ci_lookup(df, "label_risk")
        df[lab] = pd.to_numeric(df[lab], errors="coerce").astype("Int64")

    # Build feature list: keep numeric columns; drop obvious IDs/labels/categorical text
    drop_cols = {
        "recording_id",
        "subject_id",
        "age_group",
        "sex",
        "site",
        "device_model",
        "label_risk",
        "label_dx",
        "label_source",
        "label_confidence",
    }

    # Keep 'psqi_global' explicitly if numeric
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    features = [c for c in num_cols if c not in drop_cols]

    # Ensure psqi_global is in features if present and numeric
    if "psqi_global" in df.columns and "psqi_global" not in features and pd.api.types.is_numeric_dtype(df["psqi_global"]):
        features.append("psqi_global")

    # Final tidy: unique & stable order
    features = list(dict.fromkeys(features))

    return df, features
