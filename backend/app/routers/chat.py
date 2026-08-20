"""AI Healthcare Chat route."""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.deps import get_current_user_optional
from app.services.chat_service import process_message

logger = logging.getLogger(__name__)
router = APIRouter()


class _ChatBody(BaseModel):
    message: str
    conversation_id: Optional[str] = None


@router.post("")
async def chat(body: _ChatBody, user=Depends(get_current_user_optional)):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    user_id = None
    if user:
        user_id = user.id

    try:
        result = await process_message(
            message=body.message,
            user_id=user_id,
            conversation_id=body.conversation_id,
        )
        return result
    except Exception as exc:
        logger.error("Chat processing error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to process your message. Please try again.")
