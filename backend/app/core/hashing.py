import hashlib
import json
from typing import Any, Dict

def generate_commit_hash(state: Dict[str, Any]) -> str:
    """Generates a deterministic SHA-256 hash of a JSON state dictionary."""
    # Ensure keys are sorted for determinism
    serialized_state = json.dumps(state, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(serialized_state.encode('utf-8')).hexdigest()
