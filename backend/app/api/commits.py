from fastapi import APIRouter, HTTPException, Depends
from typing import Any, Dict
from app.db.models import CommitCreate
from app.db.client import get_db
from app.core.hashing import generate_commit_hash
from app.core.compress import compress_payload, decompress_payload
from app.core.auth import verify_api_key
import structlog
import uuid

router = APIRouter()
logger = structlog.get_logger()

import json
import os

def mock_s3_upload(compressed_payload: bytes) -> str:
    """Mock uploading compressed payload to Object Store (Issue 5)"""
    s3_key = f"s3://cognition-vcs-payloads/{uuid.uuid4()}.gz"
    # To make the demo work, we'll write the raw decompressed JSON to disk 
    # instead of actual S3, so we can read it back in the UI.
    os.makedirs("/tmp/cognition-mock-s3", exist_ok=True)
    local_path = f"/tmp/cognition-mock-s3/{s3_key.split('/')[-1]}.json"
    
    try:
        raw_json = decompress_payload(compressed_payload)
        with open(local_path, "w") as f:
            f.write(raw_json)
    except Exception as e:
        logger.error("mock_s3_upload_failed", error=str(e))
        
    return s3_key

def mock_s3_download(s3_key: str) -> dict:
    """Mock downloading and decompressing payload from Object Store"""
    local_path = f"/tmp/cognition-mock-s3/{s3_key.split('/')[-1]}.json"
    if os.path.exists(local_path):
        with open(local_path, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}

@router.post("/")
def create_commit(commit: CommitCreate, auth: dict = Depends(verify_api_key)):
    db = get_db()
    hash_val = generate_commit_hash(commit.payload)
    compressed_payload = compress_payload(commit.payload)
    
    # Store payload in Object Store (S3) instead of DB text column
    s3_uri = mock_s3_upload(compressed_payload)
    
    data = {
        "hash": hash_val,
        "parent_hash": commit.parent_hash,
        "branch_id": commit.branch_id,
        "payload_s3_uri": s3_uri, # Now referencing S3
        "status": "pending"
    }
    
    # Issue 2: Emulating transaction safety with try/except
    try:
        response = db.table("commits").insert(data).execute()
        db.table("branches").update({"head_commit_hash": hash_val}).eq("id", commit.branch_id).execute()
        logger.info("commit_created", hash=hash_val, branch_id=commit.branch_id)
        return {"status": "success", "commit_hash": hash_val}
    except Exception as e:
        logger.error("commit_transaction_failed", error=str(e))
        # Rollback logic for Supabase (if branching fails, delete dangling commit)
        db.table("commits").delete().eq("hash", hash_val).execute()
        raise HTTPException(status_code=500, detail="Transaction failed, commit rolled back.")

@router.get("/{commit_hash}")
def get_commit(commit_hash: str, auth: dict = Depends(verify_api_key)):
    db = get_db()
    response = db.table("commits").select("*").eq("hash", commit_hash).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Commit not found")
        
    commit_data = response.data[0]
    
    # Normally fetch from S3 here
    s3_uri = commit_data.get("payload_s3_uri")
    if s3_uri:
        # Mock fetching and decompressing
        commit_data["payload"] = "Fetched from S3: " + s3_uri
    else:
        # Legacy fallback if it was in the DB
        compressed = commit_data.get("compressed_payload")
        commit_data["payload"] = decompress_payload(compressed) if compressed else None
        
    return commit_data

@router.get("/branch/{branch_id}")
def get_branch_history(branch_id: str, agent_id: str = None, auth: dict = Depends(verify_api_key)):
    db = get_db()
    # Try fetching from DB
    try:
        response = db.table("commits").select("*").eq("branch_id", branch_id).execute()
        commits = response.data
    except Exception:
        commits = []
    
    # Format DB commits
    formatted = []
    for c in commits:
        status_raw = c.get("status", "pending")
        if status_raw == "verified":
            status_ui = "success"
            type_ui = "action"
        elif status_raw == "flagged":
            status_ui = "rollback"
            type_ui = "hallucination"
        elif status_raw == "error":
            status_ui = "error"
            type_ui = "error"
        else:
            status_ui = "pending"
            type_ui = "action"
            
        payload_uri = c.get('payload_s3_uri', "")
        payload = {}
        if isinstance(payload_uri, str) and payload_uri.startswith("s3://"):
            payload = mock_s3_download(payload_uri)
            
        commit_msg = payload.get('_commit_message', f"Agent State Update ({c.get('hash')[:7]})")
            
        formatted.append({
            "id": c.get("hash")[:7],
            "type": type_ui,
            "message": commit_msg,
            "status": status_ui,
            "time": "Just now",
            "branch": "main",
            "details": {
                "prompt": payload.get('prompt', "Command run from CLI via `cvc commit`"),
                "tool": payload.get('tool', "System"),
                "output": payload.get('output', f"Hash: {c.get('hash')}\nStatus: {status_raw}")
            }
        })
        
    # Generate custom mock data based on the requested agent_id for a fully dynamic experience
    mock_data = []
    
    if agent_id == "agent-antigravity":
        mock_data = [
            {
                "id": "ant-f12b",
                "type": "initial",
                "message": "Initialize workspace pair programming session",
                "status": "success",
                "time": "2 hours ago",
                "branch": "main",
                "details": {
                    "prompt": "You are the Antigravity assistant. Objective: Assist USER in refactoring the Rocks-Pirates theme system and landing page transitions.",
                    "tool": "System",
                    "output": "Workspace initialized. Cursor located in LandingPage.jsx and Dashboard.jsx. Prepared design system audit."
                }
            },
            {
                "id": "ant-d34g",
                "type": "action",
                "message": "Scan files for color transition blending",
                "status": "success",
                "time": "45 mins ago",
                "branch": "main",
                "details": {
                    "prompt": "Find where the hero section background color meets the features section.",
                    "tool": "GrepSearch(Query='bg-', Path='LandingPage.jsx')",
                    "output": "Located background color boundary at line 147 and 239. Applying linear layout spacing, ambient glow, and stationary gradient separator."
                }
            },
            {
                "id": "ant-h56c",
                "type": "action",
                "message": "Deploy process scanning for local LLM runtimes",
                "status": "success",
                "time": "5 mins ago",
                "branch": "main",
                "details": {
                    "prompt": "Identify running instances of local agents like Claude Code or Cursor on the developer's Linux host.",
                    "tool": "Subprocess(Command='ps -Ao pid,comm,args')",
                    "output": "Successfully discovered active process matching 'antigravity' and 'claude-code'. Merged all dynamic local instances into backend registry."
                }
            }
        ]
    elif agent_id == "agent-claude-code":
        mock_data = [
            {
                "id": "cld-a11b",
                "type": "initial",
                "message": "Initialize terminal session loop",
                "status": "success",
                "time": "3 hours ago",
                "branch": "main",
                "details": {
                    "prompt": "You are Claude Code. Objective: Help user manage their git repositories and local configurations.",
                    "tool": "System",
                    "output": "CLI terminal loop ready. Environment variables loaded successfully. Awaiting user instructions."
                }
            },
            {
                "id": "cld-b22c",
                "type": "action",
                "message": "Execute workspace file audit",
                "status": "success",
                "time": "1 hour ago",
                "branch": "main",
                "details": {
                    "prompt": "Scan modified files and check for syntax correctness.",
                    "tool": "RunCommand(Command='git status')",
                    "output": "Located active changes in backend/app/api/agents.py and frontend/src/pages/Dashboard.jsx."
                }
            }
        ]
    elif agent_id == "agent-cursor":
        mock_data = [
            {
                "id": "cur-c11d",
                "type": "initial",
                "message": "Load active editor workspace buffers",
                "status": "success",
                "time": "4 hours ago",
                "branch": "main",
                "details": {
                    "prompt": "Parse open documents in the current directory and track cursor locations.",
                    "tool": "System",
                    "output": "Indexed files: Dashboard.jsx, Signup.jsx, settings.py, and agents.py. Tracking active edits."
                }
            },
            {
                "id": "cur-d22e",
                "type": "action",
                "message": "Generate predictive inline autocompletion",
                "status": "success",
                "time": "15 mins ago",
                "branch": "main",
                "details": {
                    "prompt": "Provide auto-completion recommendations for Link state rendering in React Router.",
                    "tool": "CopilotGenerate(Prefix='<Link state={...')",
                    "output": "Suggested complete link state mapping based on local schema. User accepted prediction."
                }
            }
        ]
    elif agent_id == "agent-aider":
        mock_data = [
            {
                "id": "aid-e11f",
                "type": "initial",
                "message": "Connect to repository git HEAD",
                "status": "success",
                "time": "5 hours ago",
                "branch": "main",
                "details": {
                    "prompt": "Objective: Apply code edits specified by the user instruction in a single-step.",
                    "tool": "System",
                    "output": "Connected. Git status: clean. Ready to execute code replacement commands."
                }
            },
            {
                "id": "aid-f22g",
                "type": "action",
                "message": "Write contiguous file changes to settings.py",
                "status": "success",
                "time": "30 mins ago",
                "branch": "main",
                "details": {
                    "prompt": "Refactor settings.py to support dynamic model selections.",
                    "tool": "WriteFile(path='settings.py')",
                    "output": "Applied multi-line diff matching user request. Synthesized schema successfully."
                }
            }
        ]
    elif agent_id == "agent-copilot":
        mock_data = [
            {
                "id": "cop-g11h",
                "type": "initial",
                "message": "Initialize background workspace session",
                "status": "success",
                "time": "6 hours ago",
                "branch": "main",
                "details": {
                    "prompt": "Provide background code generation support.",
                    "tool": "System",
                    "output": "Copilot background workspace token loop active. Awaiting user cursor triggering."
                }
            }
        ]
    elif agent_id == "agent-2":
        mock_data = [
            {
                "id": "rev-c11b",
                "type": "initial",
                "message": "Begin static repository code quality sweep",
                "status": "success",
                "time": "8 hours ago",
                "branch": "main",
                "details": {
                    "prompt": "Scan the entire workspace for anti-patterns and performance hotspots.",
                    "tool": "System",
                    "output": "Scanning files. Discovered 1 performance issue in index.css (unused animations)."
                }
            },
            {
                "id": "rev-d22c",
                "type": "action",
                "message": "Scan settings.py configurations",
                "status": "success",
                "time": "2 hours ago",
                "branch": "main",
                "details": {
                    "prompt": "Verify that settings.py has correct authorization defaults.",
                    "tool": "ReadFile(path='settings.py')",
                    "output": "Flagged: mock bearer token is used. Recommending migration to secure env parameters."
                }
            }
        ]
    elif agent_id == "agent-3":
        mock_data = [
            {
                "id": "srt-a11b",
                "type": "initial",
                "message": "Fetch recent task email notifications",
                "status": "success",
                "time": "12 hours ago",
                "branch": "main",
                "details": {
                    "prompt": "Process incoming task alerts and categorize by urgency.",
                    "tool": "System",
                    "output": "Retrieved 3 new notifications from the project tracking log."
                }
            },
            {
                "id": "srt-b22c",
                "type": "action",
                "message": "Inject sorted task commits into repository DAG",
                "status": "success",
                "time": "3 hours ago",
                "branch": "main",
                "details": {
                    "prompt": "Commit urgency categories directly to the Merkle-tree.",
                    "tool": "MerkleTreeInsert(node_id='mail-382')",
                    "output": "Success. Generated state hash 0x7a8b9c."
                }
            }
        ]
    else:
        # Default: Fallback to Financial Research Agent data (matching agent-1 or others)
        mock_data = [
            {
                "id": "c8f2a1b",
                "type": "initial",
                "message": "Initialize agent context and objective",
                "status": "success",
                "time": "1 hour ago",
                "branch": "main",
                "details": {
                    "prompt": f"You are a cognitive developer agent. Objective: Research EV market trends or system status for {agent_id}.",
                    "tool": "System",
                    "output": "Understood. I will begin by searching for recent news and stock data."
                }
            },
            {
                "id": "d4e5f6g",
                "type": "action",
                "message": "Search web for 'EV market trends 2026'",
                "status": "success",
                "time": "55 mins ago",
                "branch": "main",
                "details": {
                    "prompt": "I need to understand the current macro environment.",
                    "tool": "TavilySearch(query='EV market trends 2026')",
                    "output": "[Results: Global EV sales show steady growth, primarily driven by Asian markets...]"
                }
            },
            {
                "id": "f9e8d7c",
                "type": "hallucination",
                "message": "Draft summary report (Failed)",
                "status": "rollback",
                "time": "2 mins ago",
                "branch": "experiment-draft",
                "details": {
                    "prompt": "Compile the data into a paragraph.",
                    "tool": "WriteFile(path='report.md')",
                    "output": "Tesla dominates with a share price of $14,000...",
                    "watchdog": "CRITICAL: Agent confused market cap/volume with share price. Hallucination detected."
                }
            }
        ]
        
    return {"status": "success", "data": mock_data + formatted}
