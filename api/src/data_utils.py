import pandas as pd
from pathlib import Path
from .utils import logger

def read_csv(path):
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"{path} not found")
    df = pd.read_csv(str(p))
    return df

def validate_columns(df, required):
    missing = [c for c in required if c not in df.columns]
    if missing:
        logger.error("Missing columns: %s", missing)
        raise ValueError(f"Missing required columns: {missing}")
    return True
