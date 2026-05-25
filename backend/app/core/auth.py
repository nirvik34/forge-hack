from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import structlog

logger = structlog.get_logger()
security = HTTPBearer()

def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates API key (Issue 4). 
    In production, this should check against Supabase Auth or a hashed key database.
    """
    token = credentials.credentials
    # Mocking JWT/API Key validation
    if token != "mock-secure-api-key" and not os.getenv("SKIP_AUTH", False):
        logger.warning("unauthorized_access", token_prefix=token[:5])
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"user_id": "authenticated_agent", "scopes": ["commit:write", "commit:read"]}
