"""
Combine raw files in api/data/raw/ into api/data/night_summary.csv if needed.
If api/data/night_summary.csv already exists, this step is optional.
"""
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT.parent / "data"
RAW_DIR = DATA_DIR / "raw"
COMBINED_OUT = DATA_DIR / "night_summary.csv"

def discover_files(d):
    patterns = ["*.csv", "*.parquet", "*.json", "*.xlsx", "*.xls"]
    files = []
    for p in patterns:
        files.extend(sorted(d.glob(p)))
    return files

def load_file(path: Path):
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    if path.suffix.lower() in (".xls", ".xlsx"):
        return pd.read_excel(path)
    if path.suffix.lower() == ".json":
        return pd.read_json(path, lines=False)
    if path.suffix.lower() == ".parquet":
        return pd.read_parquet(path)
    raise ValueError(f"Unsupported format: {path}")

def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    files = discover_files(RAW_DIR)
    if not files:
        if COMBINED_OUT.exists():
            print("Combined file exists; skipping data load.")
            return
        raise SystemExit(f"No raw files in {RAW_DIR}. Place your per-subject files there or place night_summary.csv manually.")
    dfs = []
    for f in files:
        try:
            df = load_file(f)
            df.columns = [c.strip().lower() for c in df.columns]
            dfs.append(df)
            print("Loaded", f.name, "shape", df.shape)
        except Exception as e:
            print("Failed to load", f, ":", e)
    combined = pd.concat(dfs, ignore_index=True, sort=False)
    combined.to_csv(COMBINED_OUT, index=False)
    print("Saved combined dataset to", COMBINED_OUT, "shape:", combined.shape)

if __name__ == "__main__":
    main()
