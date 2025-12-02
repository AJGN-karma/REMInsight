import shap
import numpy as np

def explain_rows(model, X, feats, top_k=5):
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    if isinstance(shap_values, list):
        arr = shap_values[1] if len(shap_values) > 1 else shap_values[0]
    else:
        arr = shap_values
    rows = []
    for row in arr:
        idx = np.argsort(np.abs(row))[::-1][:top_k]
        rows.append([{ "feature": feats[i], "shap": float(row[i]) } for i in idx])
    return rows
