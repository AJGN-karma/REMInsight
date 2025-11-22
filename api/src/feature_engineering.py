# Lightweight, deterministic derived features for CSVs
import numpy as np
import pandas as pd

def ensure_derived(df):
    # rem_to_tst_ratio: REM_total_min / TST_min
    if "rem_to_tst_ratio" not in df.columns:
        df["rem_to_tst_ratio"] = df["REM_total_min"] / df["TST_min"].replace(0, np.nan)
    # rem_latency_ratio: REM_latency_min / TST_min
    if "rem_latency_ratio" not in df.columns:
        df["rem_latency_ratio"] = df["REM_latency_min"] / df["TST_min"].replace(0, np.nan)
    # theta_alpha_ratio
    if "theta_alpha_ratio" not in df.columns and ("mean_theta_pow" in df.columns and "mean_alpha_pow" in df.columns):
        df["theta_alpha_ratio"] = df["mean_theta_pow"] / df["mean_alpha_pow"].replace(0, np.nan)
    return df
