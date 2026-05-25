# backend/app/api/cli.py
"""CLI API endpoints using an in-memory store.

Provides `/cli/execute` to run a command (placeholder) and `/cli/history` to fetch recent commands.
This avoids DB dependencies for the development prototype.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

router = APIRouter()

# In-memory command store
_cli_store: List[dict] = []

class CLICommandRequest(BaseModel):
    command: str
    args: Optional[List[str]] = None

class CLICommandResponse(BaseModel):
    id: int
    command: str
    args: Optional[List[str]] = None
    output: str
    timestamp: datetime

@router.post("/execute", response_model=CLICommandResponse)
async def execute_cli(cmd: CLICommandRequest):
    """Execute a CLI command (placeholder) and store it in memory.

    The real implementation would delegate to backend logic. Here we simply echo the command.
    """
    output = f"Executed: {cmd.command}" + (" " + " ".join(cmd.args) if cmd.args else "")
    record = {
        "id": len(_cli_store) + 1,
        "command": cmd.command,
        "args": cmd.args,
        "output": output,
        "timestamp": datetime.utcnow(),
    }
    _cli_store.append(record)
    return CLICommandResponse(**record)

@router.get("/history", response_model=List[CLICommandResponse])
async def cli_history(limit: int = 20):
    """Retrieve recent CLI command history from the in‑memory store.
    """
    # Return the most recent `limit` entries, newest first
    return [_cli_store[i] for i in range(max(len(_cli_store) - limit, 0), len(_cli_store))][::-1]
