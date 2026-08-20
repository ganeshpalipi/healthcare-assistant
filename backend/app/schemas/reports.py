from typing import Any, Dict, List
from pydantic import BaseModel


class ReportResponse(BaseModel):
    summary: str
    extracted_info: Dict[str, Any] = {}
    explanations: List[str] = []
    disclaimer: str = (
        "This report analysis is for educational and informational purposes only. "
        "It does NOT replace professional medical interpretation of laboratory results "
        "or imaging studies. Please consult your healthcare provider for accurate "
        "interpretation and clinical decisions."
    )
