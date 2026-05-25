from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import datetime
import random

router = APIRouter()

# Schema for Pydantic
class CliTokenSchema(BaseModel):
    description: str
    token: str
    created_at: str
    last_used: str

class SettingsUpdateSchema(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    url: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    avatar: Optional[str] = None
    gemini_key: Optional[str] = None
    openai_key: Optional[str] = None
    github_connected: Optional[bool] = None
    slack_connected: Optional[bool] = None
    cli_tokens: Optional[List[CliTokenSchema]] = None
    subscription_plan: Optional[str] = None
    token_quota_total: Optional[float] = None

# Global in-memory storage of the settings, pre-populated with standard user details
_USER_SETTINGS = {
    "name": "Nirvik Dev",
    "username": "nirvik-dev",
    "email": "nirvik@cognitionvcs.ai",
    "bio": "Researching multi-agent VCS structures.",
    "url": "https://cognitionvcs.ai",
    "company": "Autonomous Systems Lab",
    "location": "San Francisco, CA",
    "avatar": "https://ui-avatars.com/api/?name=Nirvik+Dev&background=0D8ABC&color=fff&size=200",
    "gemini_key": "AIzaSyB-H8_9kLm3_v002_d4735304",
    "openai_key": "sk-proj-LL87x291vLa9qM0",
    "github_connected": True,
    "slack_connected": False,
    "cli_tokens": [
        {
            "description": "cvc-cli-session-office",
            "token": "cvc_pat_e8d5f4c2c9d1a3b8d4c5",
            "created_at": "May 19, 2026",
            "last_used": "May 20, 2026"
        }
    ],
    "subscription_plan": "Free Tier",
    "token_quota_used": 1.2,
    "token_quota_total": 5.0
}

@router.get("/")
def get_settings():
    return {
        "status": "success",
        "data": _USER_SETTINGS
    }

@router.post("/update")
def update_settings(payload: SettingsUpdateSchema):
    for key, value in payload.dict(exclude_unset=True).items():
        if key == "cli_tokens":
            # Convert schema objects to dicts
            _USER_SETTINGS["cli_tokens"] = [t.dict() for t in value]
        else:
            _USER_SETTINGS[key] = value
    return {
        "status": "success",
        "message": "Settings updated successfully",
        "data": _USER_SETTINGS
    }

@router.post("/token/generate")
def generate_token(payload: BaseModel):
    # Base class for generate token
    pass

@router.post("/token/revoke")
def revoke_token(payload: BaseModel):
    # Base class for revoke token
    pass
