"""
RAG retriever – loads the FAISS index and provides a search function.
Gracefully handles missing index files.
"""
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Module-level state
_faiss_index = None
_chunks_metadata: List[Dict[str, str]] = []
_retriever = None
_ready = False


def initialise_retriever() -> bool:
    """
    Load the FAISS index and metadata at startup.
    Returns True if retrieval is ready; False otherwise (non-fatal).
    """
    global _faiss_index, _chunks_metadata, _retriever, _ready  # noqa: PLW0603

    from app.core.config import settings

    index_path = settings.rag_index_path
    metadata_path = settings.rag_metadata_path

    if not index_path.exists() or not metadata_path.exists():
        logger.info(
            "RAG index not found at %s – retrieval will return empty results.",
            index_path,
        )
        return False

    try:
        from langchain_community.vectorstores import FAISS
        from langchain_openai import OpenAIEmbeddings

        # Load metadata for reference
        with open(metadata_path, "r", encoding="utf-8") as f:
            _chunks_metadata = json.load(f)

        # Build a temp index directory (FAISS expects save_local directory)
        embeddings = OpenAIEmbeddings(
            api_key=settings.OPENAI_API_KEY,
            model="text-embedding-ada-002",
        )
        _faiss_index = FAISS.load_local(
            str(index_path.parent),
            embeddings,
            allow_dangerous_deserialization=True,
        )
        _ready = True
        logger.info(
            "RAG retriever ready – %d chunks in index.",
            len(_chunks_metadata),
        )
        return True

    except ImportError as exc:
        logger.warning("RAG retrieval packages not available: %s", exc)
        return False
    except Exception as exc:
        logger.warning("Failed to load RAG index: %s", exc)
        return False


def is_ready() -> bool:
    """Return whether the retriever has been successfully initialised."""
    return _ready


def search(query: str, top_k: Optional[int] = None) -> List[Dict[str, str]]:
    """
    Search the FAISS index for chunks relevant to *query*.

    Returns a list of dicts with keys ``text`` and ``source``.
    If the index is not loaded, returns an empty list.
    """
    if not _ready or _faiss_index is None:
        return []

    try:
        from app.core.config import settings

        k = top_k if top_k is not None else settings.RAG_TOP_K
        docs = _faiss_index.similarity_search(query, k=k)
        results: List[Dict[str, str]] = []
        for doc in docs:
            results.append({
                "text": doc.page_content,
                "source": doc.metadata.get("source", ""),
            })
        return results
    except Exception as exc:
        logger.warning("RAG search failed: %s", exc)
        return []
