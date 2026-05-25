from app.core.hashing import generate_commit_hash

def test_deterministic_hashing():
    state1 = {"a": 1, "b": 2}
    state2 = {"b": 2, "a": 1}
    
    assert generate_commit_hash(state1) == generate_commit_hash(state2)
