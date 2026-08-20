import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.core.deps import get_current_user_optional, get_db

logger = logging.getLogger(__name__)
router = APIRouter()

_memory_history: dict = {}


def _collection():
    db = get_db()
    return db["chat_history"] if db else None


@router.get("")
async def list_history(user=Depends(get_current_user_optional)):
    user_id = getattr(user, "id", None) or "anonymous"
    col = _collection()

    if col:
        cursor = col.find({"user_id": user_id}).sort("timestamp", -1).limit(50)
        results = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            results.append(doc)
        return {"history": results}

    user_hist = [h for h in _memory_history.values() if h.get("user_id") == user_id]
    return {"history": user_hist, "note": "In-memory storage (demo mode)"}


@router.get("/{history_id}")
async def get_history_entry(history_id: str, user=Depends(get_current_user_optional)):
    col = _collection()

    if col:
        from bson import ObjectId
        try:
            doc = await col.find_one({"_id": ObjectId(history_id)})
            if not doc:
                raise HTTPException(status_code=404, detail="Chat entry not found")
            doc["id"] = str(doc.pop("_id"))
            return doc
        except HTTPException:
            raise
        except Exception:
            pass

    if history_id in _memory_history:
        return _memory_history[history_id]

    raise HTTPException(status_code=404, detail="Chat entry not found")


@router.delete("/{history_id}")
async def delete_history_entry(history_id: str, user=Depends(get_current_user_optional)):
    col = _collection()

    if col:
        from bson import ObjectId
        try:
            result = await col.delete_one({"_id": ObjectId(history_id)})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Chat entry not found")
            return {"message": "Chat entry deleted."}
        except HTTPException:
            raise
        except Exception:
            pass

    if history_id in _memory_history:
        del _memory_history[history_id]
        return {"message": "Chat entry deleted."}

    raise HTTPException(status_code=404, detail="Chat entry not found")
