"""Authentication routes: register, login, get current user."""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator

from app.core.deps import get_current_user_optional, get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.schemas.auth import TokenResponse, UserResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory fallback for when MongoDB is unavailable
_memory_users: dict = {}


class _RegisterBody(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class _LoginBody(BaseModel):
    email: str
    password: str


def _users_collection():
    db = get_db()
    if db:
        return db["users"]
    return None


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: _RegisterBody):
    col = _users_collection()

    if col:
        existing = await col.find_one({"email": body.email})
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        existing_name = await col.find_one({"username": body.username})
        if existing_name:
            raise HTTPException(status_code=409, detail="Username already taken")
    else:
        for u in _memory_users.values():
            if u["email"] == body.email:
                raise HTTPException(status_code=409, detail="Email already registered")
            if u["username"] == body.username:
                raise HTTPException(status_code=409, detail="Username already taken")

    hashed = get_password_hash(body.password)
    user_doc = {
        "username": body.username,
        "email": body.email,
        "hashed_password": hashed,
    }

    from datetime import datetime, timezone
    user_doc["created_at"] = datetime.now(timezone.utc).isoformat()

    if col:
        result = await col.insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        user_id = str(len(_memory_users) + 1)
        user_doc["id"] = user_id
        _memory_users[user_id] = user_doc
        logger.warning("MongoDB unavailable – user stored in memory only.")

    token = create_access_token({"sub": user_id, "email": body.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            username=body.username,
            email=body.email,
            created_at=user_doc["created_at"],
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: _LoginBody):
    col = _users_collection()
    user_doc = None

    if col:
        user_doc = await col.find_one({"email": body.email})
    else:
        for u in _memory_users.values():
            if u["email"] == body.email:
                user_doc = u
                break

    if not user_doc or not verify_password(body.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user_doc.get("_id", user_doc.get("id", "")))
    token = create_access_token({"sub": user_id, "email": body.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            username=user_doc["username"],
            email=user_doc["email"],
            created_at=user_doc.get("created_at", ""),
        ),
    )


@router.get("/me", response_model=UserResponse)
async def me(user=Depends(get_current_user_optional)):
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
