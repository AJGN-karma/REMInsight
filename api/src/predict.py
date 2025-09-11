from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np
import pandas as pd
from joblib import load

# load features list
def _load_features(path: Path) -> list[str]:
    return json.loads((path / "features.json").read_text(encoding="utf-8"))

def main():
    p = argparse.ArgumentParser(description="Predict risk for one or more rows (CSV/JSON).")
    p.add_argument("--model-dir", required=True, help="Folder with xgb_model.joblib / imputer.joblib / scaler.joblib / features.json")
    p.add_argument("--rows", required=True, help="Path to CSV/JSON with columns matching your training schema")
    args = p.parse_args()

    mdir = Path(args.model_dir)
    model = load(mdir / "xgb_model.joblib")
    imputer = load(mdir / "imputer.joblib")
    scaler = load(mdir / "scaler.joblib")
    features = _load_features(mdir)

    # read input rows
    if args.rows.lower().endswith(".json"):
        data = pd.DataFrame(json.loads(Path(args.rows).read_text(encoding="utf-8")))
    else:
        data = pd.read_csv(args.rows)

    # select features present; missing become NaN then imputed
    X = data.reindex(columns=features, fill_value=np.nan).values
    X_imp = imputer.transform(X)
    X_scl = scaler.transform(X_imp)

    probs = model.predict_proba(X_scl)
    pred = probs.argmax(axis=1)

    out = []
    for i in range(len(data)):
        out.append({
            "row": i,
            "pred_risk": int(pred[i]),
            "probs": probs[i].round(6).tolist()
        })
    print(json.dumps(out, indent=2))

if __name__ == "__main__":
    main()
