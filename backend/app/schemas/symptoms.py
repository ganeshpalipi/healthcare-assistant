from typing import List
from pydantic import BaseModel


class SymptomCheckRequest(BaseModel):
    symptoms: List[str]


class SymptomInfo(BaseModel):
    symptom: str
    severity: str
    possible_causes: List[str]
    warning_signs: List[str]


class SymptomCheckResponse(BaseModel):
    identified_symptoms: List[SymptomInfo]
    possible_causes: List[str]
    risk_level: str
    warning_signs: List[str]
    recommended_action: str
    disclaimer: str = (
        "This symptom assessment is for general informational purposes only and does NOT "
        "constitute a medical diagnosis. Possible causes may include a range of conditions, "
        "both common and serious. Please consult a qualified healthcare professional for an "
        "accurate diagnosis and appropriate treatment."
    )
