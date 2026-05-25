# CognitionVCS

Git for AI Agents.

## Setup
1. Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
2. Frontend: `cd frontend && npm install && npm run dev`
3. Database: Import `supabase/migrations/*.sql` to your Supabase project.

See `docs/genearte.md` for architecture details.
