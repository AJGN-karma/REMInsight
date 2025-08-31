# Model Card — REMInsight XGBoost

**Task**: Multi-class risk classification (0/1/2) from night-level sleep features.  
**Intended use**: Screening support, not diagnostic.  
**Data**: PSQI (c1..c7, global), REM metrics (latency, pct, density, TST), spectral powers, artifacts, missingness, demographics.  
**Ethics**: No PHI; consent for storage; deletion-on-request.  
**Metrics**: Report accuracy, macro-F1, per-class recall, ROC-AUC (OvR), Brier score.  
**Limitations**: Night-level only; depends on preprocessing; subject/device/site shifts can impact calibration.
