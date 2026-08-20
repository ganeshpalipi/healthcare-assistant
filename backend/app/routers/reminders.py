"""Medication reminders CRUD."""
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.deps import get_current_user_optional, get_db

logger = logging.getLogger(__name__)
router = APIRouter()

_memory_reminders: dict = {}


def _collection():
    db = get_db()
    return db["reminders"] if db else None


class _ReminderCreate(BaseModel):
    medicine_name: str
    dosage: str
    time: str
    date: str
    frequency: str = "daily"


class _ReminderUpdate(BaseModel):
    medicine_name: Optional[str] = None
    dosage: Optional[str] = None
    time: Optional[str] = None
    date: Optional[str] = None
    frequency: Optional[str] = None
    active: Optional[bool] = None


@router.get("")
async def list_reminders(user=Depends(get_current_user_optional)):
    user_id = getattr(user, "id", None) or "anonymous"
    col = _collection()

    if col:
        cursor = col.find({"user_id": user_id}).sort("created_at", -1)
        results = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            results.append(doc)
        return {"reminders": results}

    user_reminders = [r for r in _memory_reminders.values() if r.get("user_id") == user_id]
    return {"reminders": user_reminders, "note": "In-memory storage (demo mode)"}


@router.post("", status_code=201)
async def create_reminder(body: _ReminderCreate, user=Depends(get_current_user_optional)):
    user_id = getattr(user, "id", None) or "anonymous"
    reminder = {
        **body.model_dump(),
        "user_id": user_id,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    col = _collection()
    if col:
        result = await col.insert_one(reminder)
        reminder["id"] = str(result.inserted_id)
    else:
        rid = f"rem-{len(_memory_reminders) + 1}"
        reminder["id"] = rid
        _memory_reminders[rid] = reminder

    return reminder


@router.put("/{reminder_id}")
async def update_reminder(reminder_id: str, body: _ReminderUpdate, user=Depends(get_current_user_optional)):
    col = _collection()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}

    if col:
        from bson import ObjectId
        try:
            result = await col.find_one_and_update(
                {"_id": ObjectId(reminder_id)},
                {"$set": updates},
                return_document=True,
            )
            if not result:
                raise HTTPException(status_code=404, detail="Reminder not found")
            result["id"] = str(result.pop("_id"))
            return result
        except Exception:
            pass

    if reminder_id in _memory_reminders:
        _memory_reminders[reminder_id].update(updates)
        return _memory_reminders[reminder_id]

    raise HTTPException(status_code=404, detail="Reminder not found")


@router.delete("/{reminder_id}")
async def delete_reminder(reminder_id: str, user=Depends(get_current_user_optional)):
    col = _collection()

    if col:
        from bson import ObjectId
        try:
            result = await col.delete_one({"_id": ObjectId(reminder_id)})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Reminder not found")
            return {"message": "Reminder deleted successfully."}
        except Exception:
            pass

    if reminder_id in _memory_reminders:
        del _memory_reminders[reminder_id]
        return {"message": "Reminder deleted successfully."}

    raise HTTPException(status_code=404, detail="Reminder not found")
