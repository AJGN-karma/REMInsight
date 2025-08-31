from __future__ import annotations
import shap
import numpy as np
import pandas as pd
from typing import Dict, Any, List

def topk_shap(model, X_row: pd.DataFrame, k: int = 5):
    # TreeExplainer works for XGBoost
    explainer = shap.TreeExplainer(model)
    vals = explainer.shap_values(X_row)
    # For multi-class, vals is list per class; use predicted class
    if isinstance(vals, list):
        # choose class with max raw prediction
        pred_class = int(model.predict(X_row)[0])
        s = np.array(vals[pred_class][0])
    else:
        s = np.array(vals[0])

    feats = X_row.columns
    idx = np.argsort(np.abs(s))[::-1][:k]
    return [(feats[i], float(s[i])) for i in idx]
