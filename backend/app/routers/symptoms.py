"""Symptom assessment route."""
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.deps import get_current_user_optional
from app.services.symptom_service import assess_symptoms

logger = logging.getLogger(__name__)
router = APIRouter()


class _SymptomBody(BaseModel):
    symptoms: list[str]


@router.post("")
async def symptom_check(body: _SymptomBody, user=Depends(get_current_user_optional)):
    if not body.symptoms:
        raise HTTPException(status_code=400, detail="At least one symptom is required")

    try:
        result = assess_symptoms(body.symptoms)
        return result
    except Exception as exc:
        logger.error("Symptom check error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to assess symptoms.")
