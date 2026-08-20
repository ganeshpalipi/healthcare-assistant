"""
Symptom analysis service.
Uses LLM when available, otherwise falls back to rule-based mapping.
"""
import logging
from typing import Any, Dict, List

from app.core.config import settings
from app.safety.emergency import check_risk_level, is_emergency

logger = logging.getLogger(__name__)

SYMPTOM_DISCLAIMER = (
    "This symptom assessment is for general informational purposes only and does NOT "
    "constitute a medical diagnosis. Possible causes may include a range of conditions, "
    "both common and serious. Please consult a qualified healthcare professional for an "
    "accurate diagnosis and appropriate treatment."
)

# ── Rule-based symptom mappings ─────────────────────────────────────────

SYMPTOM_CAUSE_MAP: Dict[str, List[str]] = {
    "headache": ["viral infection", "tension", "migraine", "dehydration", "eye strain", "sinusitis"],
    "fever": ["viral infection", "bacterial infection", "influenza", "dengue", "malaria", "COVID-19"],
    "cough": ["viral infection", "bacterial infection", "asthma", "allergies", "bronchitis", "pneumonia"],
    "sore throat": ["viral pharyngitis", "bacterial tonsillitis", "allergies", "acid reflux", "dry air"],
    "fatigue": ["viral infection", "anemia", "thyroid disorder", "depression", "sleep deprivation", "diabetes"],
    "nausea": ["gastroenteritis", "food poisoning", "migraine", "pregnancy", "medication side effect"],
    "vomiting": ["gastroenteritis", "food poisoning", "migraine", "appendicitis", "inner ear disorder"],
    "diarrhea": ["gastroenteritis", "food poisoning", "irritable bowel syndrome", "lactose intolerance"],
    "rash": ["allergic reaction", "viral exanthem", "eczema", "contact dermatitis", "fungal infection"],
    "chest pain": ["musculoskeletal pain", "acid reflux", "anxiety", "respiratory infection"],
    "shortness of breath": ["asthma", "respiratory infection", "anxiety", "anemia", "allergic reaction"],
    "dizziness": ["dehydration", "low blood pressure", "inner ear issue", "anemia", "medication side effect"],
    "joint pain": ["arthritis", "viral infection", "injury", "autoimmune condition", "gout"],
    "back pain": ["muscle strain", "poor posture", "herniated disc", "kidney stones", "sciatica"],
    "abdominal pain": ["gastroenteritis", "gas", "constipation", "ulcer", "appendicitis", "gallstones"],
    "itching": ["allergies", "dry skin", "eczema", "fungal infection", "insect bite"],
    "sneezing": ["common cold", "allergies", "rhinitis", "dust exposure"],
    "runny nose": ["common cold", "allergies", "sinusitis", "rhinitis"],
    "wheezing": ["asthma", "bronchitis", "allergic reaction", "respiratory infection"],
    "blurred vision": ["refractive error", "eye strain", "diabetes", "cataract", "migraine"],
    "swelling": ["injury", "allergic reaction", "infection", "fluid retention", "autoimmune condition"],
    "insomnia": ["stress", "anxiety", "caffeine", "irregular sleep schedule", "depression"],
    "anxiety": ["stress", "generalised anxiety disorder", "caffeine", "thyroid disorder", "panic disorder"],
    "depression": ["major depressive disorder", "thyroid disorder", "vitamin deficiency", "chronic stress"],
    "muscle pain": ["viral infection", "overexertion", "fibromyalgia", "electrolyte imbalance", "medication"],
    "earache": ["otitis media", "earwax buildup", "sinus infection", "swimmer's ear", "TMJ disorder"],
    "toothache": ["dental caries", "gum infection", "tooth abscess", "teeth grinding", "sinusitis"],
    "constipation": ["low fiber diet", "dehydration", "lack of exercise", "medication side effect", "IBS"],
    "bloating": ["gas", "food intolerance", "IBS", "overeating", "constipation"],
    "heartburn": ["acid reflux", "GERD", "hiatal hernia", "spicy foods", "overeating"],
    "hair loss": ["genetics", "stress", "thyroid disorder", "nutritional deficiency", "autoimmune condition"],
    "palpitations": ["anxiety", "caffeine", "arrhythmia", "hyperthyroidism", "anemia"],
    "numbness": ["nerve compression", "vitamin B12 deficiency", "diabetes", "multiple sclerosis", "carpal tunnel"],
    "tingling": ["nerve compression", "vitamin B12 deficiency", "diabetes", "anxiety", "poor circulation"],
    "night sweats": ["infection", "hormonal changes", "medication side effect", "hyperthyroidism", "lymphoma"],
    "weight loss": ["hyperthyroidism", "diabetes", "infection", "cancer", "depression", "malnutrition"],
    "weight gain": ["hypothyroidism", "medication side effect", "PCOS", "depression", "sedentary lifestyle"],
}

SEVERITY_MAP: Dict[str, Dict[str, Any]] = {
    "severe": {"level": "high", "label": "Severe"},
    "intense": {"level": "high", "label": "Intense"},
    "extreme": {"level": "high", "label": "Extreme"},
    "unbearable": {"level": "high", "label": "Unbearable"},
    "mild": {"level": "low", "label": "Mild"},
    "slight": {"level": "low", "label": "Slight"},
    "moderate": {"level": "moderate", "label": "Moderate"},
}

WARNING_SIGNS_GLOBAL = [
    "difficulty breathing", "chest pain", "loss of consciousness", "severe bleeding",
    "high fever (above 103°F / 39.4°C)", "sudden severe headache", "sudden weakness on one side",
    "sudden vision changes", "persistent vomiting", "blood in vomit or stool",
    "signs of dehydration (extreme thirst, little urination)",
]


async def analyze_symptoms(symptoms: List[str]) -> Dict[str, Any]:
    """
    Analyze a list of symptoms and return a structured assessment.
    Tries LLM first; falls back to rule-based mapping.
    """
    combined_text = ", ".join(symptoms)

    # Check for emergency
    if is_emergency(combined_text):
        return {
            "identified_symptoms": [_symptom_info(s, "Severe") for s in symptoms],
            "possible_causes": ["This requires immediate emergency medical evaluation."],
            "risk_level": "urgent",
            "warning_signs": ["EMERGENCY – Seek immediate medical attention!"],
            "recommended_action": (
                "**Call your local emergency number (e.g., 911, 112, 108) immediately.** "
                "Do not attempt to self-treat. This may be a life-threatening condition."
            ),
            "disclaimer": SYMPTOM_DISCLAIMER,
        }

    # Try LLM-based analysis
    if settings.is_openai_configured:
        result = await _llm_analyze(symptoms)
        if result is not None:
            return result

    # Rule-based fallback
    return _rule_based_analyze(symptoms)


async def _llm_analyze(symptoms: List[str]) -> Optional[Dict[str, Any]]:
    """Use OpenAI to analyze symptoms."""
    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        prompt = f"""Analyze the following symptoms and provide a structured assessment.

Symptoms: {', '.join(symptoms)}

Respond in this exact JSON format (no markdown, no code fences):
{{
  "identified_symptoms": [
    {{"symptom": "...", "severity": "Mild/Moderate/Severe", "possible_causes": ["cause1", "cause2"], "warning_signs": ["sign1"]}}
  ],
  "possible_causes": ["general cause 1", "general cause 2"],
  "risk_level": "low/moderate/high",
  "warning_signs": ["sign1", "sign2"],
  "recommended_action": "action text"
}}

IMPORTANT RULES:
- Never provide a confirmed diagnosis. Use "Possible causes may include..."
- List general categories of conditions, not specific diagnoses.
- Always recommend consulting a doctor.
- Use "Possible causes may include" language throughout."""

        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a symptom analysis assistant. Respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=600,
        )
        import json
        content = response.choices[0].message.content or ""
        # Strip code fences if present
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        result = json.loads(content)
        result["disclaimer"] = SYMPTOM_DISCLAIMER
        return result
    except Exception as exc:
        logger.warning("LLM symptom analysis failed: %s", exc)
        return None


def _rule_based_analyze(symptoms: List[str]) -> Dict[str, Any]:
    """Rule-based symptom analysis fallback."""
    identified = []
    all_causes: List[str] = []
    all_warnings: List[str] = []
    max_risk = "low"

    for symptom in symptoms:
        symptom_lower = symptom.lower().strip()
        severity = _guess_severity(symptom_lower)
        causes = SYMPTOM_CAUSE_MAP.get(symptom_lower, ["various conditions", "requires medical evaluation"])
        warnings = []

        # Determine risk
        risk = check_risk_level(symptom_lower)
        if risk == "high" and max_risk != "urgent":
            max_risk = "high"
        elif risk == "moderate" and max_risk not in ("urgent", "high"):
            max_risk = "moderate"

        identified.append({
            "symptom": symptom,
            "severity": severity,
            "possible_causes": causes,
            "warning_signs": warnings,
        })
        all_causes.extend(causes)

    # Deduplicate causes
    seen = set()
    unique_causes = []
    for c in all_causes:
        if c.lower() not in seen:
            seen.add(c.lower())
            unique_causes.append(c)

    # Recommended action based on risk
    if max_risk == "high":
        recommended = (
            "Based on the symptoms described, **prompt medical consultation is recommended**. "
            "Please schedule an appointment with a healthcare provider within the next 24-48 hours. "
            "If symptoms worsen significantly, seek emergency care."
        )
    elif max_risk == "moderate":
        recommended = (
            "These symptoms are common and may resolve with rest and self-care. "
            "However, **consult a doctor if symptoms persist for more than 3-5 days or worsen**. "
            "Monitor your condition closely and stay hydrated."
        )
    else:
        recommended = (
            "These symptoms appear mild. General self-care measures such as adequate rest, "
            "hydration, and over-the-counter medications (following package instructions) may help. "
            "**Consult a healthcare provider if symptoms persist or worsen.**"
        )

    return {
        "identified_symptoms": identified,
        "possible_causes": unique_causes,
        "risk_level": max_risk,
        "warning_signs": all_warnings if all_warnings else WARNING_SIGNS_GLOBAL[:3],
        "recommended_action": recommended,
        "disclaimer": SYMPTOM_DISCLAIMER,
    }


def _guess_severity(symptom_text: str) -> str:
    """Guess severity from text based on keywords."""
    for kw, info in SEVERITY_MAP.items():
        if kw in symptom_text:
            return info["label"]
    return "Moderate"


def _symptom_info(symptom: str, severity: str) -> Dict[str, Any]:
    """Create a SymptomInfo dict for a single symptom."""
    causes = SYMPTOM_CAUSE_MAP.get(symptom.lower(), ["requires emergency evaluation"])
    return {
        "symptom": symptom,
        "severity": severity,
        "possible_causes": causes,
        "warning_signs": [],
    }
