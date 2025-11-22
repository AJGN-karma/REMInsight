#!/usr/bin/env bash
set -euo pipefail
SA_JSON="$1"
BUCKET="rem-insights.appspot.com"
if [ -z "${SA_JSON:-}" ]; then
  echo "Usage: $0 /path/to/service-account.json" >&2
  exit 1
fi
gsutil -i "${SA_JSON}" cp api/models/xgb_model.joblib "gs://${BUCKET}/models/xgb_model.joblib"
gsutil -i "${SA_JSON}" cp api/models/scaler.joblib "gs://${BUCKET}/models/scaler.joblib"
gsutil -i "${SA_JSON}" cp api/models/imputer.joblib "gs://${BUCKET}/models/imputer.joblib"
gsutil -i "${SA_JSON}" cp api/models/features.json "gs://${BUCKET}/models/features.json"
gsutil -i "${SA_JSON}" cp api/models/training_summary.json "gs://${BUCKET}/models/training_summary.json"
gsutil -i "${SA_JSON}" cp api/models/evaluation_report.json "gs://${BUCKET}/models/evaluation_report.json"
echo "To create a signed URL for model (7d):"
echo "gsutil signurl -d 7d ${SA_JSON} gs://${BUCKET}/models/xgb_model.joblib"
