#!/usr/bin/env bash
set -euo pipefail

# always run from api/ directory
cd "$(dirname "$0")/.."

echo "[1/6] Setting up virtualenv..."
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate

echo "[2/6] Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "[3/6] Data load (optional, uses data/raw/ if present)..."
python -m src.0_data_load || true

echo "[4/6] Preprocessing..."
python -m src.1_preprocess

echo "[5/6] Feature engineering..."
python -m src.2_feature_engineering

echo "[6/6] Hyperparameter tuning (if enabled in config)..."
python -m src.4_hyperopt || true

echo "[7/6] Training with subject-wise CV..."
python -m src.3_train_cv

echo "[8/6] Evaluating latest model..."
python -m src.5_evaluate

echo "✅ Pipeline finished successfully."
