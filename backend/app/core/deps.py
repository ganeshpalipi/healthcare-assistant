from typing import Any, Dict, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.security import decode_token
from app.db.database import get_database
import logging

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)


class SimpleUser:
    """Lightweight user object returned by auth dependencies."""
    def __init__(self, user_id: str, email: str = "", username: str = ""):
        self.id = user_id
        self.email = email
        self.username = username

    def model_dump(self):
        return {"id": self.id, "email": self.email, "username": self.username}


async def get_db():
    db = get_database()
    yield db


async def get_optional_db():
    db = get_database()
    yield db


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> SimpleUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization required.")
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token payload missing user identity.")
    return SimpleUser(
        user_id=str(user_id),
        email=payload.get("email", ""),
        username=payload.get("username", ""),
    )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[SimpleUser]:
    if credentials is None:
        return None
    payload = decode_token(credentials.credentials)
    if payload is None:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    return SimpleUser(
        user_id=str(user_id),
        email=payload.get("email", ""),
        username=payload.get("username", ""),
    )
