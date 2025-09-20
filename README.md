# REMInsight (REM + PSQI Psychiatric-Risk Detection)

Production-ready project to train an **XGBoost** classifier on night-level sleep features (PSQI + REM/EEG/EOG summaries), serve predictions via **FastAPI**, and integrate with a **React (Vite)** frontend. Includes schema validation, subject-wise splitting, SHAP explanations, Docker, and Render + Vercel deployment guides.

## Quick Start

### 1) Environment (Windows, Miniconda recommended)

```powershell
conda create -n reminsight python=3.10 -y
conda activate reminsight
