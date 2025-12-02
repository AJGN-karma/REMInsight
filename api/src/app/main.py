"""
REMInsight – FastAPI Inference Server
Start locally with:
    uvicorn api.src.app.main:app --host 0.0.0.0 --port 8000

Start on Render:
    python -m uvicorn api.src.api_server:app --host 0.0.0.0 --port $PORT
"""

import os
import io
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from typing import Optional, Dict, Any

# Load inference module
from .. import infer as infer_mod

# -------------------------------------------------------------------
# Create FastAPI app
# -------------------------------------------------------------------
app = FastAPI(title="REMInsight API", description="Psychiatric-risk detection using REM dynamics")

# -------------------------------------------------------------------
# CORS CONFIGURATION
# -------------------------------------------------------------------
from fastapi.middleware.cors import CORSMiddleware

origins_env = os.environ.get("ALLOWED_ORIGINS", "")

if origins_env:
    origins = [o.strip() for o in origins_env.split(",") if o.strip()]
else:
    origins = ["*"]  # permissive for dev; set env var in prod

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# HEALTH CHECK
# -------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "message": "API is running"}


# -------------------------------------------------------------------
# PREDICT USING JSON BODY
# -------------------------------------------------------------------
@app.post("/predict")
async def predict_json(
    payload: Dict[str, Any],
    version: Optional[str] = None,
    shap: Optional[bool] = False
):
    """
    Accepts:
    - Single row (dict)
    - Multiple rows { "rows": [ {...}, {...} ] }

    Returns predictions & optional SHAP contributions.
    """
    try:
        # Multiple rows
        if "rows" in payload:
            rows = payload["rows"]
            if not isinstance(rows, list):
                raise ValueError("`rows` must be a list of dictionaries")
            results = [
                infer_mod.predict_single(row, version=version, return_shap=shap)
                for row in rows
            ]
            return {"results": results}

        # Single row
        return infer_mod.predict_single(payload, version=version, return_shap=shap)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------------------------
# PREDICT USING CSV UPLOAD
# -------------------------------------------------------------------
@app.post("/predict_csv")
async def predict_csv(
    file: UploadFile = File(...),
    version: Optional[str] = None,
    shap: Optional[bool] = False
):
    """
    Upload a .csv file containing feature columns.
    """
    try:
        raw_bytes = await file.read()
        df = pd.read_csv(io.BytesIO(raw_bytes))

        results = []
        for _, row in df.iterrows():
            results.append(
                infer_mod.predict_single(row.to_dict(), version=version, return_shap=shap)
            )

        return {"results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
