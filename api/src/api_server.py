# api/src/api_server.py
"""
Compatibility entrypoint for Render / older start commands.

This module re-exports the FastAPI app defined in api.src.app.main
and adds optional CORS + small utility endpoints to make deployment
on Render/Vercel straightforward.

Start with:
    python -m uvicorn api.src.api_server:app --host 0.0.0.0 --port $PORT
"""

import os
import json
from pathlib import Path

# Import the canonical app. Use absolute import so module-style uvicorn works.
# This line should succeed when uvicorn runs as a module from repo root.
from .app.main import app  # re-exported app

# --- Add CORS middleware if not present (reads ALLOWED_ORIGINS env var) ---
# We try to add middleware only if env var is set (so default behaviour remains).
try:
    from fastapi.middleware.cors import CORSMiddleware

    origins_env = os.environ.get("ALLOWED_ORIGINS", "")
    if origins_env:
        origins = [o.strip() for o in origins_env.split(",") if o.strip()]
    else:
        # If ALLOWED_ORIGINS not set, be permissive for dev. Change in prod.
        origins = ["*"]

    # Add middleware only if not already present (avoid duplicate middleware)
    existing = [m.cls.__name__ for m in getattr(app, "user_middleware", [])]
    if "CORSMiddleware" not in existing:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
except Exception:
    # If fastapi or middleware unavailable, let app import still succeed.
    pass

# --- Small convenience endpoints (non-destructive) ---
@app.get("/health")
def _health():
    return {"status": "ok"}

@app.get("/features")
def _features():
    """
    Return the feature list and model version from the latest model dir, if present.
    Useful for the frontend to learn required feature names.
    """
    try:
        # models dir is at api/models relative to this file
        models_dir = Path(__file__).resolve().parents[1] / "models"
        versions = sorted([p for p in models_dir.iterdir() if p.is_dir() and p.name.startswith("v")])
        if not versions:
            return {"features": [], "model_version": None}
        latest = versions[-1]
        feats_file = latest / "features_full.json"
        if not feats_file.exists():
            feats_file = latest / "features.json"
        feats = json.load(open(feats_file)) if feats_file.exists() else []
        return {"features": feats, "model_version": latest.name}
    except Exception:
        return {"features": [], "model_version": None}
