import logging
from fastapi import APIRouter, HTTPException, Query
from app.services.medicine_service import get_medicine_info

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("")
async def search_medicine(query: str = Query(..., min_length=1)):
    """Return general educational medicine information."""
    try:
        result = await get_medicine_info(query)
        return result
    except Exception as exc:
        logger.error("Medicine info error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve medicine information.")
