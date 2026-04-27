# VeriTrace Lite

VeriTrace Lite is an AI-assisted material verification system for regulated and pharma supply chains.

## Architecture Overview

The planned workflow is:

COA PDF + material label -> Azure Document Intelligence extraction -> parser -> deterministic validation against SQLite master data -> risk engine decision -> Azure OpenAI summary and recommendation -> React dashboard.

The backend will expose FastAPI endpoints for health checks, material and supplier master data, demo scenarios, and verification workflows. The frontend will be a Vite React app for uploads, demo scenario review, decisions, findings, recommendations, and verification history.

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The SQLite database is created at `backend/storage/veritrace.db` (path is
controlled by `DATABASE_PATH` in the root `.env`). On first startup the app
auto-creates the schema and seeds it from `backend/data/*.json`. To re-run
seeding manually:

```bash
python backend/seed.py
```

Sanity-check endpoints once the server is running:

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/materials
curl http://localhost:8000/api/materials/MAT-PCM-001
curl http://localhost:8000/api/suppliers
```

## Frontend Setup

Frontend implementation is planned under `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

## Data

Synthetic demo documents live in `datasets/`.

Seed data, parser aliases, and demo extraction JSON live in `backend/data/`.

Legacy ComplyScope files are preserved in `archive/complyscope_legacy/`.
