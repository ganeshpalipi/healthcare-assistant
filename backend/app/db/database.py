"""
MongoDB connection management with graceful failure.
If MongoDB is unavailable the application continues to run in demo mode.
"""
import logging
from typing import Optional

from pymongo import MongoClient
from pymongo.database import Database

from app.core.config import settings

logger = logging.getLogger(__name__)

# Module-level references – stay None when MongoDB cannot be reached
db_client: Optional[MongoClient] = None
db: Optional[Database] = None


def init_database() -> bool:
    """
    Attempt to connect to MongoDB.  Returns True on success.
    On failure, logs a WARNING and leaves db_client / db as None.
    """
    global db_client, db  # noqa: PLW0603

    if not settings.is_mongodb_configured:
        logger.warning(
            "MONGODB_URL is not configured.  The application will run in demo mode."
        )
        return False

    try:
        db_client = MongoClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
        # Force a round-trip to verify connectivity
        db_client.admin.command("ping")
        db = db_client[settings.MONGODB_DATABASE]
        logger.info("Successfully connected to MongoDB: %s", settings.MONGODB_DATABASE)
        return True
    except Exception as exc:
        logger.warning(
            "Could not connect to MongoDB: %s.  Continuing in demo mode.", exc
        )
        db_client = None
        db = None
        return False


def get_database() -> Optional[Database]:
    """Return the database handle or None when MongoDB is unavailable."""
    return db


def close_database() -> None:
    """Close the MongoDB client (called on shutdown)."""
    global db_client, db  # noqa: PLW0603
    if db_client is not None:
        try:
            db_client.close()
            logger.info("MongoDB connection closed.")
        except Exception as exc:
            logger.warning("Error while closing MongoDB: %s", exc)
    db_client = None
    db = None
