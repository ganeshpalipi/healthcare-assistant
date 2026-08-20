"""
Appointment service – demo doctor data and CRUD for appointments.
Uses MongoDB when available; in-memory fallback otherwise.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.db.database import get_database

logger = logging.getLogger(__name__)

# ── Demo doctors ───────────────────────────────────────────────────────

DOCTORS: List[Dict[str, Any]] = [
    {
        "id": "doc-001",
        "name": "Dr. Priya Sharma",
        "specialty": "Cardiology",
        "available_days": ["Monday", "Wednesday", "Friday"],
        "available_times": ["09:00", "10:00", "11:00", "14:00", "15:00"],
    },
    {
        "id": "doc-002",
        "name": "Dr. Rajesh Gupta",
        "specialty": "Dermatology",
        "available_days": ["Tuesday", "Thursday", "Saturday"],
        "available_times": ["10:00", "11:00", "12:00", "16:00"],
    },
    {
        "id": "doc-003",
        "name": "Dr. Ananya Reddy",
        "specialty": "General Medicine",
        "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "available_times": ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00"],
    },
    {
        "id": "doc-004",
        "name": "Dr. Vikram Patel",
        "specialty": "Orthopedics",
        "available_days": ["Monday", "Wednesday", "Saturday"],
        "available_times": ["10:00", "11:00", "15:00", "16:00"],
    },
    {
        "id": "doc-005",
        "name": "Dr. Meera Iyer",
        "specialty": "Pediatrics",
        "available_days": ["Monday", "Tuesday", "Thursday", "Friday"],
        "available_times": ["09:00", "10:00", "11:00", "14:00"],
    },
    {
        "id": "doc-006",
        "name": "Dr. Arun Kumar",
        "specialty": "ENT (Ear, Nose, Throat)",
        "available_days": ["Tuesday", "Wednesday", "Friday"],
        "available_times": ["11:00", "12:00", "15:00", "16:00"],
    },
]

# In-memory appointments fallback
_in_memory_appointments: Dict[str, Dict[str, Any]] = {}


def get_doctors() -> List[Dict[str, Any]]:
    """Return the list of demo doctors."""
    return DOCTORS


def get_doctor_by_id(doctor_id: str) -> Optional[Dict[str, Any]]:
    """Look up a doctor by ID."""
    for doc in DOCTORS:
        if doc["id"] == doctor_id:
            return doc
    return None


async def list_appointments(user_id: str) -> List[Dict[str, Any]]:
    """Return all appointments for a user."""
    db = get_database()
    results: List[Dict[str, Any]] = []

    if db is not None:
        for doc in db.appointments.find({"user_id": user_id}).sort("created_at", -1):
            results.append(_serialize(doc, is_mongo=True))
    else:
        for apt in _in_memory_appointments.values():
            if apt["user_id"] == user_id:
                results.append(_serialize(apt, is_mongo=False))

    return results


async def create_appointment(
    user_id: str, doctor_id: str, date: str, time: str, reason: str
) -> Optional[Dict[str, Any]]:
    """Book a new appointment."""
    doctor = get_doctor_by_id(doctor_id)
    if doctor is None:
        return None

    apt_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    apt_doc = {
        "_id": apt_id,
        "user_id": user_id,
        "doctor_id": doctor_id,
        "doctor": doctor,
        "date": date,
        "time": time,
        "reason": reason,
        "status": "scheduled",
        "created_at": now,
    }

    db = get_database()
    if db is not None:
        db.appointments.insert_one(apt_doc.copy())
    else:
        _in_memory_appointments[apt_id] = apt_doc

    return _serialize(apt_doc, is_mongo=db is not None)


async def update_appointment(apt_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update an existing appointment."""
    db = get_database()
    update_fields = {k: v for k, v in updates.items() if v is not None}

    if not update_fields:
        return None

    if db is not None:
        result = db.appointments.find_one_and_update(
            {"_id": apt_id, "user_id": user_id},
            {"$set": update_fields},
            return_document=True,  # AFTER
        )
        if result:
            return _serialize(result, is_mongo=True)
    else:
        apt = _in_memory_appointments.get(apt_id)
        if apt and apt["user_id"] == user_id:
            apt.update(update_fields)
            return _serialize(apt, is_mongo=False)

    return None


async def delete_appointment(apt_id: str, user_id: str) -> bool:
    """Cancel/delete an appointment."""
    db = get_database()

    if db is not None:
        result = db.appointments.delete_one({"_id": apt_id, "user_id": user_id})
        return result.deleted_count > 0
    else:
        apt = _in_memory_appointments.get(apt_id)
        if apt and apt["user_id"] == user_id:
            del _in_memory_appointments[apt_id]
            return True
    return False


def _serialize(doc: Dict[str, Any], is_mongo: bool) -> Dict[str, Any]:
    """Convert a DB document into the API response format."""
    return {
        "id": str(doc["_id"]) if is_mongo else doc["_id"],
        "doctor": doc.get("doctor", {}),
        "date": doc["date"],
        "time": doc["time"],
        "reason": doc["reason"],
        "status": doc.get("status", "scheduled"),
        "user_id": doc["user_id"],
        "created_at": doc["created_at"] if not is_mongo else doc["created_at"],
        "_demo": is_mongo is False,
    }
