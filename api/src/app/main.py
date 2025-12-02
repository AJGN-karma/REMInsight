"""
FastAPI inference app. Start with:
uvicorn api.src.app.main:app --host 0.0.0.0 --port 8000
"""
from fastapi import FastAPI, HTTPException, UploadFile, File
from typing import Optional
from .. import infer as infer_mod

app = FastAPI(title="REMInsight API")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict_json(payload: dict, version: Optional[str] = None, shap: Optional[bool] = False):
    try:
        if "rows" in payload:
            results = [infer_mod.predict_single(row, version=version, return_shap=shap) for row in payload["rows"]]
            return {"results": results}
        res = infer_mod.predict_single(payload, version=version, return_shap=shap)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict_csv")
async def predict_csv(file: UploadFile = File(...), version: Optional[str] = None):
    contents = await file.read()
    import io, pandas as pd
    df = pd.read_csv(io.BytesIO(contents))
    results = []
    for _, row in df.iterrows():
        results.append(infer_mod.predict_single(row.to_dict(), version=version))
    return {"results": results}
