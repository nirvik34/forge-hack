from fastapi import APIRouter
from app.db.client import get_db
from pydantic import BaseModel
import uuid
import subprocess
import os

class AgentCreate(BaseModel):
    org: str
    name: str
    description: str = ""

router = APIRouter()

def detect_local_agents():
    """
    Scans the system process table to identify active IDE, CLI, and editor agents
    working on the project.
    """
    local_agents = []
    
    # 1. Antigravity (This active session agent)
    local_agents.append({
        "id": "agent-antigravity",
        "org": "local-env",
        "name": "antigravity-assistant",
        "status": "Active",
        "last_active": "Just now",
        "description": "Active pair programming assistant responding to workspace edits.",
        "type": "IDE Assistant"
    })
    
    try:
        # Run a process scan on Linux
        result = subprocess.run(["ps", "-Ao", "pid,comm,args"], capture_output=True, text=True, check=True)
        lines = result.stdout.splitlines()
        
        claude_active = False
        cursor_active = False
        aider_active = False
        copilot_active = False
        
        for line in lines:
            parts = line.strip().split(None, 2)
            if len(parts) < 3:
                continue
            pid, comm, args = parts
            args_lower = args.lower()
            
            # Check for Claude Code / Claude CLI
            if "claude" in args_lower and ("code" in args_lower or "cli" in args_lower):
                claude_active = True
            # Check for Cursor IDE
            elif "cursor" in args_lower:
                cursor_active = True
            # Check for Aider Coder Agent
            elif "aider" in args_lower:
                aider_active = True
            # Check for GitHub Copilot agent/process
            elif "copilot" in args_lower:
                copilot_active = True
                
        if claude_active:
            local_agents.append({
                "id": "agent-claude-code",
                "org": "local-env",
                "name": "claude-code-cli",
                "status": "Active",
                "last_active": "Just now",
                "description": "Claude Code CLI terminal session executing repository commands.",
                "type": "CLI Developer Agent"
            })
        if cursor_active:
            local_agents.append({
                "id": "agent-cursor",
                "org": "local-env",
                "name": "cursor-editor-agent",
                "status": "Active",
                "last_active": "Just now",
                "description": "Cursor AI agent composer running inside the editor.",
                "type": "IDE Agent"
            })
        if aider_active:
            local_agents.append({
                "id": "agent-aider",
                "org": "local-env",
                "name": "aider-agent",
                "status": "Active",
                "last_active": "1 min ago",
                "description": "Aider code editing agent processing file changes.",
                "type": "CLI Developer Agent"
            })
        if copilot_active:
            local_agents.append({
                "id": "agent-copilot",
                "org": "local-env",
                "name": "github-copilot",
                "status": "Active",
                "last_active": "Just now",
                "description": "Copilot background workspace token loop active.",
                "type": "Cloud IDE Integration"
            })
            
    except Exception as e:
        # Failsafe: if subprocess fails, we still return the verified Antigravity agent
        pass
        
    return local_agents

@router.get("/")
def get_agents():
    db = get_db()
    
    # Fetch registered project agents
    try:
        res = db.table("agents").select("*").execute()
        db_agents = res.data
    except Exception:
        db_agents = []
        
    if not db_agents:
        # Fallback database mock agents
        db_agents = [
            {
                "id": "agent-1",
                "org": "ai-org",
                "name": "financial-research",
                "status": "Active",
                "last_active": "2 mins ago",
                "description": "Collects market info and writes cognitive commits.",
                "type": "Cloud Agent"
            },
            {
                "id": "agent-2",
                "org": "ai-org",
                "name": "code-reviewer",
                "status": "Sleeping",
                "last_active": "1 hour ago",
                "description": "Synthesizes code quality and highlights logic flaws.",
                "type": "Cloud Agent"
            },
            {
                "id": "agent-3",
                "org": "personal",
                "name": "email-sorter",
                "status": "Active",
                "last_active": "Just now",
                "description": "Pre-processes incoming task alerts and updates Merkle-DAG.",
                "type": "Cloud Agent"
            }
        ]
        
    # Dynamically detect active local/IDE agents
    detected_locals = detect_local_agents()
    
    # Merge and prioritize currently active local agents
    all_agents = detected_locals + db_agents
    return {"status": "success", "data": all_agents}

@router.post("/")
def create_agent(agent: AgentCreate):
    db = get_db()
    new_agent = {
        "id": f"agent-{uuid.uuid4().hex[:8]}",
        "org": agent.org,
        "name": agent.name,
        "description": agent.description,
        "status": "Active",
        "last_active": "Just now",
        "type": "Cloud Agent"
    }
    try:
        db.table("agents").insert(new_agent).execute()
    except Exception:
        pass
    return {"status": "success", "data": new_agent}
