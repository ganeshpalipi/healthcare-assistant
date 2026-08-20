from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ReminderCreate(BaseModel):
    medicine_name: str = Field(..., min_length=1, max_length=200)
    dosage: str = Field(..., min_length=1, max_length=200)
    time: str  # e.g. "08:00"
    date: str = Field(..., min_length=1, max_length=50)  # e.g. "2025-01-15" or "daily"
    frequency: str = Field(default="daily", max_length=50)


class ReminderUpdate(BaseModel):
    medicine_name: Optional[str] = Field(default=None, max_length=200)
    dosage: Optional[str] = Field(default=None, max_length=200)
    time: Optional[str] = None
    date: Optional[str] = Field(default=None, max_length=50)
    frequency: Optional[str] = Field(default=None, max_length=50)
    active: Optional[bool] = None


class ReminderResponse(BaseModel):
    id: str
    user_id: str
    medicine_name: str
    dosage: str
    time: str
    date: str
    frequency: str
    active: bool = True
    created_at: datetime
