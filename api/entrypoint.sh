#!/usr/bin/env bash
# api/entrypoint.sh
set -euo pipefail

WORKDIR="/app"
MODEL_DIR="${WORKDIR}/api/models"
MODEL_FILE="${MODEL_DIR}/xgb_model.joblib"
SCALER_FILE="${MODEL_DIR}/scaler.joblib"
IMPUTER_FILE="${MODEL_DIR}/imputer.joblib"

: "${MODEL_URL:=}"
: "${SCALER_URL:=}"
: "${IMPUTER_URL:=}"

log() { echo "ENTRYPOINT: $*"; }

mkdir -p "$MODEL_DIR"

download_if_missing() {
  local url="$1" dest="$2"
  if [ -z "$url" ]; then
    log "No URL provided for $dest; skipping (optional)."
    return 0
  fi
  if [ -f "$dest" ]; then
    log "Already present: $dest"
    return 0
  fi
  log "Downloading $dest ..."
  curl -fSL --retry 3 --retry-delay 2 "$url" -o "$dest"
  log "Downloaded -> $dest"
}

if [ -z "$MODEL_URL" ]; then
  echo "ERROR: MODEL_URL not set and model is required." >&2
  exit 1
fi

download_if_missing "$MODEL_URL" "$MODEL_FILE"
download_if_missing "$SCALER_URL" "$SCALER_FILE"
download_if_missing "$IMPUTER_URL" "$IMPUTER_FILE"

if [ ! -f "$MODEL_FILE" ]; then
  echo "ERROR: Model file missing at $MODEL_FILE after download attempt." >&2
  exit 1
fi

cd "$WORKDIR/api/src" || { echo "Cannot cd to $WORKDIR/api/src"; exit 1; }

PORT="${PORT:-8000}"
exec uvicorn api_server:app --host 0.0.0.0 --port "$PORT" --proxy-headers
