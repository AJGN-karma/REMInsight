from functools import lru_cache
import numpy as np

@lru_cache(maxsize=1)
def get_explainer(model):
    import shap
    try:
        return shap.TreeExplainer(model)
    except Exception:
        try:
            return shap.TreeExplainer(model.get_booster())
        except Exception as e:
            raise RuntimeError("Failed to init SHAP") from e

def explain_rows(model, X, feature_names, top_k=5):
    expl = get_explainer(model)
    shap_values = expl.shap_values(X)
    out = []
    for i in range(len(X)):
        sv = shap_values[i]
        idx = np.argsort(np.abs(sv))[-top_k:][::-1]
        feats = [{"feature": feature_names[j], "shap": float(sv[j])} for j in idx]
        out.append(feats)
    return out
