"""
Authentication service – handles user registration, login, and lookup.
Uses MongoDB when available; otherwise operates in-memory.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.database import get_database

logger = logging.getLogger(__name__)

# In-memory fallback store
_in_memory_users: Dict[str, Dict[str, Any]] = {}


async def register_user(
    username: str, email: str, password: str
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Register a new user.
    Returns (user_dict, error_message).  On success error_message is None.
    """
    db = get_database()
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    hashed_pw = get_password_hash(password)
    user_doc = {
        "_id": user_id,
        "username": username,
        "email": email.lower(),
        "hashed_password": hashed_pw,
        "created_at": now,
    }

    if db is not None:
        # Check existing email
        existing = db.users.find_one({"email": email.lower()})
        if existing:
            return None, "Email already registered."
        existing_username = db.users.find_one({"username": username})
        if existing_username:
            return None, "Username already taken."
        db.users.insert_one(user_doc)
        logger.info("User registered: %s (MongoDB)", email)
    else:
        # In-memory fallback
        for u in _in_memory_users.values():
            if u["email"] == email.lower():
                return None, "Email already registered."
            if u["username"] == username:
                return None, "Username already taken."
        _in_memory_users[user_id] = user_doc
        logger.info("User registered: %s (in-memory)", email)

    # Build token
    token = create_access_token({"sub": user_id, "email": email.lower(), "username": username})
    return _build_token_response(user_doc, token), None


async def authenticate_user(
    email: str, password: str
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Verify credentials and return (token_response, error_message).
    """
    db = get_database()
    user_doc: Optional[Dict[str, Any]] = None

    if db is not None:
        user_doc = db.users.find_one({"email": email.lower()})
    else:
        for u in _in_memory_users.values():
            if u["email"] == email.lower():
                user_doc = u
                break

    if user_doc is None:
        return None, "Invalid email or password."

    if not verify_password(password, user_doc["hashed_password"]):
        return None, "Invalid email or password."

    token = create_access_token({
        "sub": user_doc["_id"],
        "email": user_doc["email"],
        "username": user_doc["username"],
    })
    return _build_token_response(user_doc, token), None


async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Look up a user by ID.  Returns the safe user dict or None."""
    db = get_database()

    if db is not None:
        user_doc = db.users.find_one({"_id": user_id})
        if user_doc:
            return _safe_user(user_doc)
    else:
        user_doc = _in_memory_users.get(user_id)
        if user_doc:
            return _safe_user(user_doc)

    return None


# ── Helpers ─────────────────────────────────────────────────────────────

def _safe_user(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Strip the hashed_password from the user dict."""
    return {
        "id": str(user_doc["_id"]),
        "_id": str(user_doc["_id"]),
        "username": user_doc["username"],
        "email": user_doc["email"],
        "created_at": user_doc["created_at"],
    }


def _build_token_response(user_doc: Dict[str, Any], token: str) -> Dict[str, Any]:
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _safe_user(user_doc),
    }
