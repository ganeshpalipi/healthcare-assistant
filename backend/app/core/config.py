"""
Application configuration using pydantic-settings.
All path handling uses pathlib for Windows compatibility.
"""
from pathlib import Path
from typing import List

from pydantic import field_validator, EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Central application settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── MongoDB ──────────────────────────────────────────────────────────
    MONGODB_URL: str = ""
    MONGODB_DATABASE: str = "healthcare_assistant"

    # ── JWT / Auth ───────────────────────────────────────────────────────
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── OpenAI / LLM ─────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # ── CORS ─────────────────────────────────────────────────────────────
    FRONTEND_ORIGINS: str = "http://localhost:5173"

    # ── RAG ──────────────────────────────────────────────────────────────
    RAG_INDEX_PATH: str = "../vector_database/medical.faiss"
    RAG_METADATA_PATH: str = "../vector_database/medical_chunks.json"
    RAG_TOP_K: int = 3

    # ── NLP ───────────────────────────────────────────────────────────────
    NLP_MODEL: str = "d4data/biomedical-ner-all"
    NLP_FALLBACK_ENABLED: bool = True

    # ── Helpers ───────────────────────────────────────────────────────────
    @property
    def rag_index_path(self) -> Path:
        return BASE_DIR / self.RAG_INDEX_PATH

    @property
    def rag_metadata_path(self) -> Path:
        return BASE_DIR / self.RAG_METADATA_PATH

    @property
    def frontend_origin_list(self) -> List[str]:
        """Split comma-separated FRONTEND_ORIGINS into a list."""
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]

    @property
    def is_mongodb_configured(self) -> bool:
        return bool(self.MONGODB_URL.strip())

    @property
    def is_openai_configured(self) -> bool:
        return bool(self.OPENAI_API_KEY.strip())

    @property
    def is_rag_ready(self) -> bool:
        return self.rag_index_path.exists() and self.rag_metadata_path.exists()


def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()


settings = get_settings()
