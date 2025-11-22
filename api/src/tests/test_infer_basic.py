import os
import pytest
from ..infer import predict

def test_predict_missing_model():
    # ensure predict raises if model absent
    model_path = "api/models/xgb_model.joblib"
    if os.path.exists(model_path):
        os.remove(model_path)
    with pytest.raises(RuntimeError):
        predict([{}], model_path, "api/models/imputer.joblib", "api/models/scaler.joblib", "api/models/features.json")
