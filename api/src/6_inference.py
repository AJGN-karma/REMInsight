"""
Thin wrapper to expose predict_single to app/main.py
"""
from .infer import predict_single as predict_single_internal

def predict_single(sample: dict, version=None, return_shap=False):
    return predict_single_internal(sample, version=version, return_shap=return_shap)
