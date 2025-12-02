"""
Evaluate the latest trained version: ROC, PR, classification report, SHAP summary.
Saves plots and metrics under the selected model version folder.
"""
import yaml, joblib, json
from pathlib import Path
import pandas as pd, numpy as np, matplotlib.pyplot as plt
from sklearn.metrics import roc_curve, auc, precision_recall_curve, classification_report, confusion_matrix
from .utils import logger

ROOT = Path(__file__).resolve().parent
CFG = yaml.safe_load(open(ROOT.parent / "configs" / "train_config.yaml"))
MODELS_DIR = (ROOT.parent / "models").resolve()
ARTIFACTS = MODELS_DIR / "artifacts"

def latest_version():
    versions = sorted([p for p in MODELS_DIR.iterdir() if p.is_dir() and p.name.startswith(CFG["artifacts"].get("version_prefix","v"))])
    if not versions:
        raise FileNotFoundError("No model versions found.")
    return versions[-1]

def evaluate(version_dir: Path):
    X = pd.read_parquet(ARTIFACTS / "X.parquet")
    y = pd.read_parquet(ARTIFACTS / "y.parquet").squeeze()
    model = joblib.load(version_dir / "model.joblib")
    if "subject_id" in X.columns:
        X = X.drop(columns=["subject_id"])
    try:
        import xgboost as xgb
        dmat = xgb.DMatrix(X)
        probs = model.predict(dmat)
    except Exception:
        probs = model.predict_proba(X)[:,1] if hasattr(model, "predict_proba") else model.predict(X)
    preds = (probs >= 0.5).astype(int)

    fpr, tpr, _ = roc_curve(y, probs)
    roc_auc = auc(fpr, tpr)
    precision, recall, _ = precision_recall_curve(y, probs)
    pr_auc = auc(recall, precision)
    cr = classification_report(y, preds, output_dict=True)
    cm = confusion_matrix(y, preds)

    metrics = {"roc_auc": float(roc_auc), "pr_auc": float(pr_auc), "classification_report": cr, "confusion_matrix": cm.tolist()}
    (version_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))

    plots_dir = version_dir / "plots"
    plots_dir.mkdir(parents=True, exist_ok=True)

    plt.figure()
    plt.plot(fpr, tpr, label=f"AUC = {roc_auc:.3f}")
    plt.plot([0,1],[0,1],'--', color='gray')
    plt.title("ROC")
    plt.legend()
    plt.savefig(plots_dir / "roc.png")
    plt.close()

    plt.figure()
    plt.plot(recall, precision, label=f"PR AUC = {pr_auc:.3f}")
    plt.title("Precision-Recall")
    plt.legend()
    plt.savefig(plots_dir / "pr.png")
    plt.close()

    try:
        import shap
        explainer = shap.TreeExplainer(model)
        shap_vals = explainer.shap_values(X)
        shap.summary_plot(shap_vals, X, show=False)
        plt.savefig(plots_dir / "shap_summary.png", bbox_inches='tight')
        plt.close()
    except Exception as e:
        logger.warning("SHAP plot failed: %s", e)

    logger.info("Evaluation artifacts saved to %s", version_dir)

if __name__ == "__main__":
    v = latest_version()
    evaluate(v)
