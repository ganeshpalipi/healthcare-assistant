import logging
from typing import Any, Dict

from app.core.config import settings

logger = logging.getLogger(__name__)

DISCLAIMER = (
    "This information is for educational purposes only. "
    "Do NOT use this to self-medicate. Always consult a qualified healthcare provider "
    "before starting, stopping, or changing any medication."
)

MEDICINE_SYSTEM_PROMPT = """You are a medication information assistant providing GENERAL EDUCATIONAL information about medicines.

CRITICAL RULES:
1. NEVER prescribe medication or recommend specific dosages.
2. NEVER recommend medication for a specific patient.
3. Provide only general, publicly known information.
4. Include common uses, general precautions, common side effects, and general warnings.
5. Always include a disclaimer that this is not medical advice.
6. If you don't have reliable information, say so.
7. Mention that individual responses to medication vary."""


async def get_medicine_info(query: str) -> Dict[str, Any]:
    """Get general educational information about a medicine."""
    if not settings.is_openai_configured:
        return _fallback_response(query)

    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        prompt = f"""Provide general educational information about the following medicine or medication class:

Query: {query}

Please include:
1. Common Uses (general)
2. Common Precautions
3. Common Side Effects
4. General Warnings
5. Common Interactions (if reliable info available)

Remember: This is educational only. Never prescribe."""

        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": MEDICINE_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=600,
        )
        info = response.choices[0].message.content or "No information available."
        return {
            "medicine": query,
            "information": info,
            "disclaimer": DISCLAIMER,
            "source": "AI-generated (educational only)",
        }
    except Exception as exc:
        logger.error("Medicine info LLM error: %s", exc)
        return _fallback_response(query)


def _fallback_response(query: str) -> Dict[str, Any]:
    return {
        "medicine": query,
        "information": (
            f"General educational information about '{query}' is not available without an AI provider. "
            f"Please configure the OpenAI API key for detailed medicine information. "
            f"\n\nAlways consult your doctor or pharmacist for medication-related questions."
        ),
        "disclaimer": DISCLAIMER,
        "source": "fallback",
    }
