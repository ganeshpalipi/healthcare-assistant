"""
Medical NLP module for extracting entities from user text.
Uses a HuggingFace NER model with keyword-based fallback.
"""
import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ── Predefined medical term lists for fallback extraction ───────────────

COMMON_SYMPTOMS: List[str] = [
    "headache", "fever", "cough", "cold", "sore throat", "runny nose",
    "fatigue", "nausea", "vomiting", "diarrhea", "constipation",
    "dizziness", "rash", "itching", "swelling", "pain", "chest pain",
    "abdominal pain", "back pain", "joint pain", "muscle pain",
    "shortness of breath", "difficulty breathing", "wheezing",
    "sneezing", "watery eyes", "red eyes", "blurred vision",
    "earache", "toothache", "stomach ache", "bloating",
    "heartburn", "loss of appetite", "weight loss", "weight gain",
    "insomnia", "drowsiness", "anxiety", "depression",
    "numbness", "tingling", "tremor", "seizure", "fainting",
    "palpitations", "high blood pressure", "low blood pressure",
    "frequent urination", "excessive thirst", "dry mouth",
    "sweating", "chills", "night sweats", "hair loss",
    "brittle nails", "mouth ulcers", "bleeding gums",
]

COMMON_DISEASES: List[str] = [
    "diabetes", "hypertension", "asthma", "arthritis", "cancer",
    "heart disease", "stroke", "pneumonia", "bronchitis",
    "influenza", "malaria", "dengue", "typhoid", "tuberculosis",
    "covid", "covid-19", "coronavirus", "chickenpox", "measles",
    "mumps", "rubella", "hepatitis", "hiv", "aids",
    "eczema", "psoriasis", "migraine", "epilepsy",
    "alzheimer", "parkinson", "thyroid", "anemia",
    "kidney disease", "liver disease", "ulcer", "gastritis",
    "sinusitis", "tonsillitis", "conjunctivitis", "otitis",
    "urinary tract infection", "uti", "allergies", "anxiety disorder",
    "depression", "bipolar", "schizophrenia", "osteoporosis",
    "gout", "appendicitis", "gallstones", "kidney stones",
]

COMMON_MEDICINES: List[str] = [
    "paracetamol", "acetaminophen", "ibuprofen", "aspirin",
    "amoxicillin", "azithromycin", "metformin", "insulin",
    "omeprazole", "pantoprazole", "cetirizine", "loratadine",
    "montelukast", "salbutamol", "albuterol", "prednisone",
    "atorvastatin", "rosuvastatin", "amlodipine", "losartan",
    "metoprolol", "enalapril", "hydrochlorothiazide", "furosemide",
    "warfarin", "clopidogrel", "levothyroxine", "allopurinol",
    "diclofenac", "naproxen", "tramadol", "codeine",
    "antacid", "antibiotic", "painkiller", "vitamin d",
    "vitamin b12", "iron supplement", "calcium", "multivitamin",
]

BODY_PARTS: List[str] = [
    "head", "brain", "eye", "eyes", "ear", "ears", "nose", "throat",
    "mouth", "teeth", "gums", "tongue", "neck", "shoulder", "shoulders",
    "arm", "arms", "elbow", "wrist", "hand", "hands", "finger", "fingers",
    "chest", "breast", "heart", "lung", "lungs", "ribs",
    "abdomen", "stomach", "liver", "kidney", "kidneys", "intestine",
    "back", "spine", "hip", "pelvis", "leg", "legs", "knee", "knees",
    "ankle", "foot", "feet", "toe", "toes", "skin", "joint", "joints",
    "muscle", "muscles", "bone", "bones", "blood", "urine",
]

SEVERITY_TERMS: List[str] = [
    "mild", "moderate", "severe", "acute", "chronic",
    "slight", "intense", "extreme", "unbearable", "tolerable",
    "occasional", "frequent", "constant", "intermittent", "persistent",
    "worsening", "improving", "sudden", "gradual",
]

DURATION_TERMS: List[str] = [
    "today", "yesterday", "last week", "last month", "for days",
    "for weeks", "for months", "for years", "since", "ago",
    "morning", "evening", "night", "all day", "few hours",
    "two days", "three days", "a week", "two weeks",
]

# ── Regex patterns ───────────────────────────────────────────────────────

DURATION_PATTERN = re.compile(
    r"(?:for|since)\s+(?:the\s+)?(?:last\s+)?(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)?\s*"  # noqa: E501
    r"?(day|days|week|weeks|month|months|year|years|hour|hours)",
    re.IGNORECASE,
)

FEVER_PATTERN = re.compile(r"(\d+(?:\.\d+)?)\s*(?:degree|°|degrees?)?\s*(?:f|fahrenheit|c|celsius)?\s*fever", re.IGNORECASE)

# ── NER model state ─────────────────────────────────────────────────────

_ner_pipeline = None
_ner_available = False


def _load_ner_model() -> bool:
    """Try to load the HuggingFace NER pipeline."""
    global _ner_pipeline, _ner_available  # noqa: PLW0603
    try:
        from transformers import pipeline as hf_pipeline

        from app.core.config import settings

        _ner_pipeline = hf_pipeline(
            "ner",
            model=settings.NLP_MODEL,
            aggregation_strategy="simple",
            device=-1,  # CPU
        )
        _ner_available = True
        logger.info("HuggingFace NER model loaded: %s", settings.NLP_MODEL)
        return True
    except Exception as exc:
        logger.warning("Could not load HuggingFace NER model: %s", exc)
        logger.info("Falling back to keyword-based extraction.")
        _ner_available = False
        return False


def _extract_with_ner(text: str) -> Dict[str, List[str]]:
    """Extract entities using the HuggingFace NER pipeline."""
    result: Dict[str, List[str]] = {
        "symptoms": [],
        "diseases": [],
        "medicines": [],
        "body_parts": [],
        "severity": [],
        "duration": [],
    }
    try:
        entities = _ner_pipeline(text)  # type: ignore[operator]
        for ent in entities:
            word = ent["word"].strip()
            entity_group = ent.get("entity_group", "O").upper()
            if entity_group in ("SYMPTOM", "DISEASE", "SIGN"):
                result["symptoms"].append(word)
            elif entity_group == "DISEASE_DISORDER":
                result["diseases"].append(word)
            elif entity_group in ("MEDICATION", "DRUG"):
                result["medicines"].append(word)
            elif entity_group in ("BODY_PART", "ANATOMY"):
                result["body_parts"].append(word)
    except Exception as exc:
        logger.warning("NER extraction failed: %s", exc)
    return result


def _extract_with_keywords(text: str) -> Dict[str, List[str]]:
    """Keyword-based fallback extraction."""
    text_lower = text.lower()
    result: Dict[str, List[str]] = {
        "symptoms": [],
        "diseases": [],
        "medicines": [],
        "body_parts": [],
        "severity": [],
        "duration": [],
    }

    # Symptom matching (multi-word first, then single-word)
    for symptom in sorted(COMMON_SYMPTOMS, key=len, reverse=True):
        if symptom in text_lower and symptom not in result["symptoms"]:
            result["symptoms"].append(symptom)

    # Disease matching
    for disease in sorted(COMMON_DISEASES, key=len, reverse=True):
        if disease in text_lower and disease not in result["diseases"]:
            result["diseases"].append(disease)

    # Medicine matching
    for med in sorted(COMMON_MEDICINES, key=len, reverse=True):
        if med in text_lower and med not in result["medicines"]:
            result["medicines"].append(med)

    # Body part matching
    for part in sorted(BODY_PARTS, key=len, reverse=True):
        if part in text_lower and part not in result["body_parts"]:
            result["body_parts"].append(part)

    # Severity matching
    for sev in SEVERITY_TERMS:
        if sev in text_lower and sev not in result["severity"]:
            result["severity"].append(sev)

    # Duration matching
    for dur in DURATION_TERMS:
        if dur in text_lower and dur not in result["duration"]:
            result["duration"].append(dur)

    # Regex: duration patterns
    for m in DURATION_PATTERN.finditer(text):
        phrase = m.group(0).strip()
        if phrase not in result["duration"]:
            result["duration"].append(phrase)

    return result


# ── Public API ───────────────────────────────────────────────────────────

def initialise_nlp() -> None:
    """Attempt to load the NER model at startup."""
    from app.core.config import settings

    if settings.NLP_FALLBACK_ENABLED:
        _load_ner_model()
    else:
        logger.info("NLP model loading skipped (NLP_FALLBACK_ENABLED=false).")


def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Extract medical entities from *text*.
    Uses the NER model when available; otherwise falls back to keyword matching.
    """
    if _ner_available and _ner_pipeline is not None:
        return _extract_with_ner(text)
    return _extract_with_keywords(text)
