"""FastAPI application entry point.
Gracefully handles MongoDB, OpenAI, and RAG unavailability."""
import logging
from typing import List

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.database import init_database, get_database
from app.nlp.medical_nlp import initialise_nlp
from app.rag.retriever import init_rag

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Healthcare Conversational Assistant API",
    description="AI-powered healthcare assistant with RAG, Medical NLP, and symptom assessment.",
    version="1.0.0",
)

# ── CORS ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handler ───────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )

# ── Routers ─────────────────────────────────────────────────────────────
from app.routers import auth, chat, symptoms, appointments, reminders, reports, medicines, chat_history  # noqa: E402

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Chat"])
app.include_router(symptoms.router, prefix="/api/symptom-check", tags=["Symptom Assessment"])
app.include_router(appointments.router, prefix="/api", tags=["Appointments"])
app.include_router(reminders.router, prefix="/api/reminders", tags=["Medication Reminders"])
app.include_router(reports.router, prefix="/api/reports", tags=["Medical Reports"])
app.include_router(medicines.router, prefix="/api/medicines", tags=["Medicine Information"])
app.include_router(chat_history.router, prefix="/api/chat-history", tags=["Chat History"])


# ── Health check ────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    db = get_database()
    return {
        "status": "ok",
        "database": "connected" if db is not None else "disconnected",
        "rag": "ready" if settings.is_rag_ready else "not_ready",
        "llm": "configured" if settings.is_openai_configured else "not_configured",
    }


# ── Startup / Shutdown ──────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("Starting Healthcare Conversational Assistant API...")

    # MongoDB
    init_database()
    db = get_database()
    if db:
        logger.info("MongoDB connected successfully.")
    else:
        logger.warning("MongoDB not available. Database-dependent features will use in-memory fallback.")

    # RAG
    try:
        init_rag()
        if settings.is_rag_ready:
            logger.info("RAG index loaded successfully.")
        else:
            logger.info("RAG index not found. Run 'python scripts/build_rag.py' to build it.")
    except Exception as exc:
        logger.warning("RAG initialization failed (non-fatal): %s", exc)

    # NLP
    try:
        initialise_nlp()
    except Exception as exc:
        logger.warning("NLP initialization failed (non-fatal): %s", exc)

    # LLM status
    if settings.is_openai_configured:
        logger.info("OpenAI LLM configured (model: %s).", settings.OPENAI_MODEL)
    else:
        logger.warning("OpenAI API key not set. LLM features will use rule-based fallback.")

    logger.info("Application startup complete.")


# ── Root redirect ───────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Healthcare Conversational Assistant API", "docs": "/docs"}
