from typing import List, Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []
    risk_level: str = "low"
    disclaimer: str = (
        "This is an AI-powered healthcare assistant for educational purposes only. "
        "It does NOT provide medical diagnoses, prescribe treatments, or replace "
        "professional medical advice. Always consult a qualified healthcare provider."
    )