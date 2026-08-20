"""
Main chat service – orchestrates emergency check, NLP extraction, RAG retrieval, and LLM generation.
"""
import logging
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.nlp.medical_nlp import extract_entities
from app.rag.retriever import is_ready, search as rag_search
from app.safety.emergency import (
    check_risk_level,
    get_emergency_response,
    is_emergency,
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a knowledgeable and empathetic Healthcare Conversational Assistant designed to provide **general health information for educational purposes only**.

## CRITICAL RULES – YOU MUST FOLLOW THESE AT ALL TIMES:
1. **NEVER diagnose** any medical condition. Do not say "you have X disease". Instead say "Possible causes may include..."
2. **NEVER prescribe** medication or recommend specific dosages.
3. **NEVER recommend stopping or changing any prescribed medication.
4. **ALWAYS recommend** consulting a qualified healthcare provider for personalised medical advice.
5. **ALWAYS include** a disclaimer that your responses are for educational purposes only.
6. If the user describes emergency symptoms, direct them to emergency services immediately.
7. Be empathetic, clear, and concise.
8. If you are unsure, say so honestly.
9. Provide evidence-based general information when available.
10. Never provide medical advice for children, pregnant women, or elderly without suggesting specialist consultation.

When medical context is provided below (from RAG), incorporate it naturally. When NLP entities are extracted, acknowledge the symptoms/conditions mentioned."""

CHAT_DISCLAIMER = (
    "This is an AI-powered healthcare assistant for educational purposes only. "
    "It does NOT provide medical diagnoses, prescribe treatments, or replace "
    "professional medical advice. Always consult a qualified healthcare provider."
)


async def process_message(
    message: str, user_id: Optional[str] = None, conversation_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Full chat processing pipeline:
    1. Emergency check
    2. NLP entity extraction
    3. RAG retrieval
    4. LLM generation
    """
    # ── Step 1: Emergency check ─────────────────────────────────────────
    if is_emergency(message):
        return {
            "answer": get_emergency_response(),
            "sources": [],
            "risk_level": "urgent",
            "disclaimer": CHAT_DISCLAIMER,
        }

    risk_level = check_risk_level(message)

    # ── Step 2: NLP extraction ───────────────────────────────────────────
    entities = extract_entities(message)
    logger.debug("NLP entities extracted: %s", entities)

    # ── Step 3: RAG retrieval ────────────────────────────────────────────
    rag_results: List[Dict[str, str]] = []
    if is_ready():
        rag_results = rag_search(message)
        logger.debug("RAG retrieved %d chunks.", len(rag_results))

    # ── Step 4: Build context for LLM ───────────────────────────────────
    context_parts: List[str] = []

    # Add NLP summary
    entity_summaries: List[str] = []
    if entities.get("symptoms"):
        entity_summaries.append(f"Symptoms mentioned: {', '.join(entities['symptoms'])}")
    if entities.get("diseases"):
        entity_summaries.append(f"Conditions mentioned: {', '.join(entities['diseases'])}")
    if entities.get("medicines"):
        entity_summaries.append(f"Medicines mentioned: {', '.join(entities['medicines'])}")
    if entities.get("body_parts"):
        entity_summaries.append(f"Body parts: {', '.join(entities['body_parts'])}")
    if entities.get("severity"):
        entity_summaries.append(f"Severity indicators: {', '.join(entities['severity'])}")
    if entities.get("duration"):
        entity_summaries.append(f"Duration: {', '.join(entities['duration'])}")
    if entity_summaries:
        context_parts.append("Extracted Medical Information:\n" + "\n".join(entity_summaries))

    # Add RAG context
    if rag_results:
        rag_text = "\n\n".join(
            f"[Source: {r['source']}]\n{r['text']}" for r in rag_results
        )
        context_parts.append(f"Relevant Medical Knowledge:\n{rag_text}")

    context_block = "\n\n---\n\n".join(context_parts) if context_parts else "No additional context available."

    # ── Step 5: LLM generation ───────────────────────────────────────────
    answer = await _generate_llm_response(message, context_block, risk_level)

    # Collect sources
    sources = [r["source"] for r in rag_results if r.get("source")]

    return {
        "answer": answer,
        "sources": sources,
        "risk_level": risk_level,
        "disclaimer": CHAT_DISCLAIMER,
    }


async def _generate_llm_response(
    user_message: str, context: str, risk_level: str
) -> str:
    """Call OpenAI API to generate a response."""
    if not settings.is_openai_configured:
        return _fallback_response(user_message, risk_level)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        user_prompt = f"""## User Message:
{user_message}

## Medical Context:
{context}

## Detected Risk Level: {risk_level}

Please provide a helpful, educational response following all rules. End with a recommendation to consult a healthcare provider."""

        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=800,
        )
        return response.choices[0].message.content or _fallback_response(user_message, risk_level)

    except Exception as exc:
        logger.error("LLM generation failed: %s", exc)
        return _fallback_response(user_message, risk_level)


def _fallback_response(message: str, risk_level: str) -> str:
    """Rule-based fallback when the LLM is unavailable."""
    parts = [
        "Thank you for your question. Based on the information provided, here is some general guidance:",
    ]

    if risk_level == "high":
        parts.append(
            "Your description suggests symptoms that may require **prompt medical attention**. "
            "I strongly recommend consulting a healthcare provider as soon as possible."
        )
    elif risk_level == "moderate":
        parts.append(
            "Your symptoms are relatively common and may resolve on their own. "
            "However, if symptoms persist for more than a few days or worsen, please see a doctor."
        )
    else:
        parts.append(
            "This appears to be a general health query. Here are some general considerations:\n"
            "- Monitor your symptoms and note any changes.\n"
            "- Maintain good hydration, nutrition, and rest.\n"
            "- Over-the-counter medications may help with mild symptoms, but follow package instructions."
        )

    parts.append(
        "\n**Important:** This is general information only and does not replace professional medical advice. "
        "Please consult a qualified healthcare provider for personalised guidance."
    )
    return "\n\n".join(parts)
