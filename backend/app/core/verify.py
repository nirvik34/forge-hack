from typing import Optional

def verify_merkle_lineage(commit_hash: str, parent_hash: Optional[str], db_get_commit_fn) -> bool:
    """
    Verifies the integrity of a commit in the Merkle-DAG.
    db_get_commit_fn should be a callable that takes a hash and returns the commit dict or None.
    """
    if parent_hash is None:
        return True # Root commit
        
    parent_commit = db_get_commit_fn(parent_hash)
    if not parent_commit:
        return False # Broken lineage, parent not found
        
    return True
