"""
Emergency detection and risk assessment for healthcare conversations.
Triggers urgent responses when life-threatening symptoms are detected.
"""
import re
from typing import List

# ── Emergency keywords / phrases ─────────────────────────────────────────
EMERGENCY_KEYWORDS: List[str] = [
    # Cardiac
    "chest pain",
    "heart attack",
    "crushing chest",
    "severe chest pressure",
    # Respiratory
    "difficulty breathing",
    "can't breathe",
    "cannot breathe",
    "shortness of breath severe",
    "choking",
    "suffocating",
    # Neurological / Stroke
    "loss of consciousness",
    "unconscious",
    "fainted",
    "stroke",
    "face drooping",
    "arm weakness",
    "speech difficulty",
    "sudden numbness",
    "sudden confusion",
    "severe headache sudden",
    # Bleeding / Trauma
    "severe bleeding",
    "uncontrollable bleeding",
    "hemorrhage",
    # Mental health crisis
    "suicidal",
    "suicide",
    "want to die",
    "kill myself",
    "end my life",
    "self-harm",
    "self harm",
    # Other emergencies
    "anaphylaxis",
    "severe allergic reaction",
    "seizure",
    "seizures",
    "poisoning",
    "overdose",
    "drug overdose",
    "carbon monoxide",
    "burns severe",
    "broken bone",
    "fracture severe",
    "head injury severe",
    "pneumonia severe",
    "appendix burst",
    "ectopic pregnancy",
    "severe dehydration",
]

# ── High-risk indicators (non-emergency but need prompt attention) ───────
HIGH_RISK_KEYWORDS: List[str] = [
    "high fever",
    "fever over 103",
    "fever above 103",
    "blood in stool",
    "blood in urine",
    "coughing blood",
    "vomiting blood",
    "persistent vomiting",
    "severe abdominal pain",
    "pregnancy complications",
    "diabetic emergency",
    "insulin reaction",
    "low blood sugar severe",
    "high blood sugar severe",
]

# ── Moderate risk indicators ────────────────────────────────────────────
MODERATE_RISK_KEYWORDS: List[str] = [
    "fever",
    "headache",
    "cough",
    "sore throat",
    "rash",
    "body ache",
    "body ache",
    "fatigue",
    "nausea",
    "vomiting",
    "diarrhea",
    "dizziness",
    "joint pain",
    "muscle pain",
    "ear pain",
    "eye pain",
    "back pain",
    "neck pain",
    "stomach pain",
    "chest discomfort",
    "anxiety",
    "depression",
    "insomnia",
]

EMERGENCY_RESPONSE = (
    "\u26a0\ufe0f  **EMERGENCY DETECTED** \u26a0\ufe0f\n\n"
    "Based on what you've described, you may be experiencing a **medical emergency**.  "
    "Please take immediate action:\n\n"
    "1.  **Call your local emergency number** (e.g., **911** in the US, **112** in Europe, **108** in India) **right now**.\n"
    "2.  Do **NOT** drive yourself to the hospital if you are alone.\n"
    "3.  If someone is with you, ask them to call for help.\n"
    "4.  If you have been prescribed emergency medication (e.g., nitroglycerin, EpiPen), use it as directed.\n\n"
    "**This AI assistant cannot provide emergency care.  Please seek immediate medical attention.**"
)


def _normalise(text: str) -> str:
    """Lower-case and strip extra whitespace for matching."""
    return re.sub(r"\s+", " ", text.lower().strip())


def is_emergency(text: str) -> bool:
    """Return True if *text* contains any emergency keyword/phrase."""
    normalised = _normalise(text)
    return any(kw in normalised for kw in EMERGENCY_KEYWORDS)


def get_emergency_response() -> str:
    """Return the urgent emergency message."""
    return EMERGENCY_RESPONSE


def check_risk_level(text: str) -> str:
    """
    Classify the overall risk level of *text*.
    Returns one of: "urgent", "high", "moderate", "low".
    """
    normalised = _normalise(text)

    if any(kw in normalised for kw in EMERGENCY_KEYWORDS):
        return "urgent"
    if any(kw in normalised for kw in HIGH_RISK_KEYWORDS):
        return "high"
    if any(kw in normalised for kw in MODERATE_RISK_KEYWORDS):
        return "moderate"
    return "low"
