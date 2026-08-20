/**
Medication reminder service – CRUD operations.
Uses MongoDB when available; in-memory fallback otherwise.
*/
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.db.database import get_database

logger = logging.getLogger(__name__)

# In-memory fallback
_in_memory_reminders: Dict[str, Dict[str, Any]] = {}


async def list_reminders(user_id: str) -> List[Dict[str, Any]]:
    db = get_database()
    results: List[Dict[str, Any]] = []

    if db is not None:
        for doc in db.reminders.find({"user_id": user_id}).sort("created_at", -1):
            results.append(_serialize(doc, is_mongo=True))
    else:
        for r in _in_memory_reminders.values():
            if r["user_id"] == user_id:
                results.append(_serialize(r, is_mongo=False))

    return results


async def create_reminder(
    user_id: str,
    medicine_name: str,
    dosage: str,
    time: str,
    date: str,
    frequency: str,
) -> Dict[str, Any]:
    reminder_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    doc = {
        "_id": reminder_id,
        "user_id": user_id,
        "medicine_name": medicine_name,
        "dosage": dosage,
        "time": time,
        "date": date,
        "frequency": frequency,
        "active": True,
        "created_at": now,
    }

    db = get_database()
    if db is not None:
        db.reminders.insert_one(doc.copy())
    else:
        _in_memory_reminders[reminder_id] = doc

    return _serialize(doc, is_mongo=db is not None)


async def update_reminder(
    reminder_id: str, user_id: str, updates: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    db = get_database()
    update_fields = {k: v for k, v in updates.items() if v is not None}

    if not update_fields:
        return None

    if db is not None:
        result = db.reminders.find_one_and_update(
            {"_id": reminder_id, "user_id": user_id},
            {"$set": update_fields},
            return_document=True,
        )
        if result:
            return _serialize(result, is_mongo=True)
    else:
        reminder = _in_memory_reminders.get(reminder_id)
        if reminder and reminder["user_id"] == user_id:
            reminder.update(update_fields)
            return _serialize(reminder, is_mongo=False)

    return None


async def delete_reminder(reminder_id: str, user_id: str) -> bool:
    db = get_database()

    if db is not None:
        result = db.reminders.delete_one({"_id": reminder_id, "user_id": user_id})
        return result.deleted_count > 0
    else:
        reminder = _in_memory_reminders.get(reminder_id)
        if reminder and reminder["user_id"] == user_id:
            del _in_memory_reminders[reminder_id]
            return True
    return False


def _serialize(doc: Dict[str, Any], is_mongo: bool) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]) if is_mongo else doc["_id"],
        "user_id": doc["user_id"],
        "medicine_name": doc["medicine_name"],
        "dosage": doc["dosage"],
        "time": doc["time"],
        "date": doc["date"],
        "frequency": doc["frequency"],
        "active": doc.get("active", True),
        "created_at": doc["created_at"],
    }
