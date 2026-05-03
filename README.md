# 🧠 REMInsight – AI-Based Psychiatric Risk Detection using REM Sleep

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?color=6C63FF&size=28&center=true&vCenter=true&width=700&lines=AI+%2B+Sleep+Science+%3D+Early+Mental+Health+Detection;REMInsight+%7C+Smart+Psychiatric+Analysis;From+Sleep+Patterns+to+Predictive+Insights" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Next.js-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Backend-FastAPI-green?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/ML-XGBoost-orange?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Database-Firebase-yellow?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Deployment-Vercel%20%7C%20Render-black?style=for-the-badge"/>
</p>

---

## 🚀 Overview

REMInsight is an AI-driven healthcare system designed to enable **early detection of psychiatric disorders** through analysis of **REM sleep dynamics** combined with **PSQI (Pittsburgh Sleep Quality Index)**.

This project integrates:
- 🧠 Sleep Science  
- 🤖 Machine Learning  
- 📊 Signal Processing  
- 🌐 Full-Stack Web Development  

to deliver a **non-invasive, real-time mental health assessment tool**.

---

## 🎯 Problem Statement

Psychiatric disorders such as:

- Depression  
- Anxiety  
- Schizophrenia  

are strongly associated with **abnormal REM sleep patterns**.

### ⚠️ Limitations of Traditional Diagnosis:
- Subjective evaluation  
- Late-stage detection  
- Limited continuous monitoring  

---

## 💡 Solution

REMInsight introduces a **data-driven approach** that:

✔ Uses REM sleep metrics + PSQI scores  
✔ Applies Machine Learning for classification  
✔ Provides early risk detection  
✔ Enables scalable and accessible analysis  

---

## 🧪 Methodology

### 📊 Data Processing
- Temporal and spectral analysis of REM sleep signals  
- Fourier Transform for frequency domain insights  
- Statistical feature extraction  

---

### 🤖 Machine Learning Model

- **XGBoost Classifier**
  - High accuracy  
  - Handles complex patterns  
  - Interpretable results  

---

### 📥 Input Features

- REM sleep duration  
- REM density  
- Sleep cycle distribution  
- PSQI score  

---

### 📤 Output

- Risk Classification:
  - Low  
  - Moderate  
  - High  

---

## 🏗️ System Architecture
User Input
↓
Next.js Frontend
↓
FastAPI Backend
↓
Feature Extraction
↓
XGBoost Model
↓
Risk Prediction
↓
Firebase Storage

---

## 🔄 Workflow

```mermaid
graph TD
A[User Inputs Sleep Data] --> B[Feature Extraction]
B --> C[Signal Processing]
C --> D[XGBoost Model]
D --> E[Risk Classification]
E --> F[Results Dashboard]
**| Layer            | Technology     |
| ---------------- | -------------- |
| Frontend         | Next.js        |
| Backend          | FastAPI        |
| Machine Learning | XGBoost        |
| Database         | Firebase       |
| Deployment       | Vercel, Render |
| CI/CD            | GitHub         |

Risk Level: Moderate
Confidence Score: 87%
Recommendation: Clinical consultation advised**

🎨 Key Features

✨ AI-based psychiatric risk prediction
✨ Integration of objective + subjective sleep data
✨ Real-time analysis
✨ Secure authentication (Firebase)
✨ Scalable deployment
✨ User-friendly interface


