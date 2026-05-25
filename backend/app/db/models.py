from pydantic import BaseModel
from typing import Optional, Dict, Any

class AgentCreate(BaseModel):
    name: str
    system_prompt: str

class BranchCreate(BaseModel):
    agent_id: str
    name: str
    head_commit_hash: Optional[str] = None

class CommitCreate(BaseModel):
    parent_hash: Optional[str] = None
    branch_id: str
    payload: Dict[str, Any]

class WatchdogScan(BaseModel):
    commit_hash: str
