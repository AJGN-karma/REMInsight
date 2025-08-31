import os, json
from ..infer import load_artifacts, prepare_X_from_features, scale_numeric, predict_single

def test_infer_paths():
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    model_path = os.path.join(base, "api/models/xgb_model.joblib")
    scaler_path = os.path.join(base, "api/models/scaler.joblib")
    feat_path = os.path.join(base, "api/models/feature_list.json")
    # These files exist after training; test is skipped if not found.
    if not (os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(feat_path)):
        return
    model, scaler, features = load_artifacts(model_path, scaler_path, feat_path)
    sample = {
        "recording_id":"s1","subject_id":"u1","age":30,"sex":"male","site":"site_a","device_model":"model_x",
        "psqi_c1":1,"psqi_c2":1,"psqi_c3":1,"psqi_c4":1,"psqi_c5":1,"psqi_c6":0,"psqi_c7":1,"psqi_global":6,
        "TST_min":420,"REM_total_min":90,"REM_latency_min":80,"REM_pct":0.21,"REM_density":0.18,
        "sleep_efficiency_pct":0.92,"micro_arousals_count":14,
        "mean_delta_pow":1.1,"mean_theta_pow":0.7,"mean_alpha_pow":0.5,"mean_beta_pow":0.3,
        "artifact_pct":2.0,"percent_epochs_missing":0.0
    }
    X = prepare_X_from_features(sample, features)
    X = scale_numeric(X, scaler, ["age","psqi_c","psqi_global","TST_min","REM_total_min","REM_latency_min","REM_pct","REM_density","sleep_efficiency_pct","micro_arousals_count","mean_delta_pow","mean_theta_pow","mean_alpha_pow","mean_beta_pow","artifact_pct","percent_epochs_missing","psqi_rem_density_interaction","age_REM_latency_ratio","theta_alpha_ratio"])
    pred, proba, conf = predict_single(model, X)
    assert pred in [0,1,2]
    assert len(proba) == 3
    assert 0.0 <= conf <= 1.0
