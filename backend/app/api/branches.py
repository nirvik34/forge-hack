from fastapi import APIRouter, HTTPException
from app.db.models import BranchCreate
from app.db.client import get_db

router = APIRouter()

@router.post("/")
def create_branch(branch: BranchCreate):
    db = get_db()
    data = {
        "agent_id": branch.agent_id,
        "name": branch.name,
        "head_commit_hash": branch.head_commit_hash
    }
    response = db.table("branches").insert(data).execute()
    return {"status": "success", "branch": response.data[0]}

@router.get("/{agent_id}")
def get_branches(agent_id: str):
    db = get_db()
    response = db.table("branches").select("*").eq("agent_id", agent_id).execute()
    return {"status": "success", "branches": response.data}
