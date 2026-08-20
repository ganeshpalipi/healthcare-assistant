import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.deps import get_current_user_optional, get_db

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Demo doctor data ─────────────────────────────────────────────────────
DEMO_DOCTORS = [
    {"id": "doc-1", "name": "Dr. Priya Sharma", "specialty": "General Medicine", "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "available_times": ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00"]},
    {"id": "doc-2", "name": "Dr. Rajesh Kumar", "specialty": "Cardiology", "available_days": ["Monday", "Wednesday", "Friday"], "available_times": ["10:00", "10:30", "11:00", "11:30", "15:00", "15:30", "16:00"]},
    {"id": "doc-3", "name": "Dr. Anita Desai", "specialty": "Dermatology", "available_days": ["Tuesday", "Thursday", "Saturday"], "available_times": ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00"]},
    {"id": "doc-4", "name": "Dr. Vikram Patel", "specialty": "Orthopedics", "available_days": ["Monday", "Tuesday", "Thursday", "Friday"], "available_times": ["09:00", "10:00", "11:00", "14:00", "15:00"]},
    {"id": "doc-5", "name": "Dr. Neha Gupta", "specialty": "Pediatrics", "available_days": ["Monday", "Wednesday", "Thursday", "Saturday"], "available_times": ["09:00", "09:30", "10:00", "10:30", "14:00", "14:30"]},
    {"id": "doc-6", "name": "Dr. Arun Mehta", "specialty": "ENT (Ear, Nose, Throat)", "available_days": ["Tuesday", "Wednesday", "Friday"], "available_times": ["10:00", "11:00", "14:00", "15:00", "16:00"]},
]

_memory_appointments: dict = {}


def _collection():
    db = get_db()
    return db["appointments"] if db else None


class _ApptCreate(BaseModel):
    doctor_id: str
    date: str
    time: str
    reason: str


class _ApptUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    reason: Optional[str] = None
    status: Optional[str] = None


@router.get("/doctors")
async def list_doctors():
    """Return demo doctor list. Labelled as demo data."""
    return {"doctors": DEMO_DOCTORS, "note": "This is demo data for demonstration purposes."}


@router.get("/appointments")
async def list_appointments(user=Depends(get_current_user_optional)):
    user_id = getattr(user, "id", None) or "anonymous"
    col = _collection()

    if col:
        cursor = col.find({"user_id": user_id}).sort("created_at", -1)
        results = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            results.append(doc)
        return {"appointments": results}

    # In-memory fallback
    user_appts = [a for a in _memory_appointments.values() if a.get("user_id") == user_id]
    return {"appointments": user_appts, "note": "In-memory storage (demo mode)"}


@router.post("/appointments", status_code=201)
async def create_appointment(body: _ApptCreate, user=Depends(get_current_user_optional)):
    user_id = getattr(user, "id", None) or "anonymous"
    doctor = next((d for d in DEMO_DOCTORS if d["id"] == body.doctor_id), None)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    appt = {
        "doctor": doctor,
        "date": body.date,
        "time": body.time,
        "reason": body.reason,
        "status": "scheduled",
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    col = _collection()
    if col:
        result = await col.insert_one(appt)
        appt["id"] = str(result.inserted_id)
    else:
        appt_id = f"appt-{len(_memory_appointments) + 1}"
        appt["id"] = appt_id
        _memory_appointments[appt_id] = appt

    return appt


@router.put("/appointments/{appt_id}")
async def update_appointment(appt_id: str, body: _ApptUpdate, user=Depends(get_current_user_optional)):
    col = _collection()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}

    if col:
        from bson import ObjectId
        try:
            result = await col.find_one_and_update(
                {"_id": ObjectId(appt_id)},
                {"$set": updates},
                return_document=True,
            )
            if not result:
                raise HTTPException(status_code=404, detail="Appointment not found")
            result["id"] = str(result.pop("_id"))
            return result
        except Exception:
            pass

    # In-memory fallback
    if appt_id in _memory_appointments:
        _memory_appointments[appt_id].update(updates)
        return _memory_appointments[appt_id]

    raise HTTPException(status_code=404, detail="Appointment not found")


@router.delete("/appointments/{appt_id}")
async def delete_appointment(appt_id: str, user=Depends(get_current_user_optional)):
    col = _collection()

    if col:
        from bson import ObjectId
        try:
            result = await col.delete_one({"_id": ObjectId(appt_id)})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Appointment not found")
            return {"message": "Appointment cancelled successfully."}
        except Exception:
            pass

    if appt_id in _memory_appointments:
        del _memory_appointments[appt_id]
        return {"message": "Appointment cancelled successfully."}

    raise HTTPException(status_code=404, detail="Appointment not found")
