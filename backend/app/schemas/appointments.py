from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class DoctorResponse(BaseModel):
    id: str
    name: str
    specialty: str
    available_days: List[str]
    available_times: List[str]


class AppointmentCreate(BaseModel):
    doctor_id: str
    date: str  # ISO date string, e.g. 2025-01-15
    time: str  # e.g. "10:00"
    reason: str = Field(..., min_length=3, max_length=500)


class AppointmentUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    reason: Optional[str] = None
    status: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: str
    doctor: DoctorResponse
    date: str
    time: str
    reason: str
    status: str
    user_id: str
    created_at: datetime
