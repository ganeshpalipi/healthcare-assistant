import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.deps import get_current_user_optional
from app.services.report_service import analyze_report

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload")
async def upload_report(file: UploadFile = File(...), user=Depends(get_current_user_optional)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""

    if ext not in ("pdf", "txt", "png", "jpg", "jpeg"):
        raise HTTPException(status_code=400, detail="Supported formats: PDF, TXT, PNG, JPG")

    content = await file.read()

    try:
        result = analyze_report(content, ext, file.filename)
        return result
    except Exception as exc:
        logger.error("Report analysis error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to analyze report.")
