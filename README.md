# Service Advisor Performance Tracker

Production-oriented dashboard replacing the manual Excel workbook
(`Service_Advisor_Performance_Tracker_2026_-_Group.xlsx`) with a real
web application: monthly Excel upload → validated ingestion → SQLite
(Postgres-upgradeable) → API → React dashboard.

This repo currently reflects **Stage 4 (Project Setup)** only: a clean,
verified, running foundation. No dashboard pages or ingestion logic yet
— see `STAGE_NOTES.md` for what's built vs. what's next.

## Project structure

```
sa-tracker/
├── backend/            FastAPI + SQLAlchemy + SQLite
│   ├── app/
│   │   ├── core/        config.py, database.py
│   │   ├── models/       advisor.py, snapshot.py, upload.py
│   │   ├── services/     identity.py, advisor_resolution.py
│   │   ├── api/routes/   health.py
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── frontend/            React + Vite + TypeScript + Tailwind
│   └── src/
│       ├── layouts/      AppLayout.tsx (sidebar + mobile bottom nav)
│       ├── pages/        6 routed pages (placeholders pending Stage 5+)
│       ├── services/     api.ts (typed API client)
│       └── components/
└── STAGE_NOTES.md       Decisions log — read this before continuing
```

## Running it locally

### Backend

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Verify: `curl http://127.0.0.1:8000/api/health` should return
`{"status":"ok","environment":"development","database_connected":true}`.
Tables are created automatically on first run (SQLite file
`backend/sa_tracker.db`).

Run tests: `python -m pytest tests/ -q` (from `backend/`, venv active).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:5173`. The Overview page's "Backend connection
status" card confirms it can reach the API — this is the current
end-to-end proof, not a real dashboard yet.

## Moving to Postgres later

Change `DATABASE_URL` in `backend/.env` (e.g.
`postgresql+psycopg2://user:pass@host:5432/sa_tracker`), install a
Postgres driver (`psycopg2-binary`), and switch `Base.metadata.create_all()`
in `main.py` for real Alembic migrations. No other code changes required —
this was a deliberate design goal.
