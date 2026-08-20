"""
RAG Index Builder Script
Reads medical documents from ../medical_documents/, creates embeddings, and builds a FAISS index.

Windows-compatible: Uses pathlib for all paths.
Run: python scripts/build_rag.py
"""
import json
import logging
import sys
from pathlib import Path
from typing import List, Dict

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
MEDICAL_DOCS_DIR = PROJECT_ROOT / "medical_documents"
VECTOR_DB_DIR = PROJECT_ROOT / "vector_database"
INDEX_PATH = VECTOR_DB_DIR / "medical.faiss"
METADATA_PATH = VECTOR_DB_DIR / "medical_chunks.json"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def load_documents(docs_dir: Path) -> List[Dict[str, str]]:
    """Load all .txt files from the medical documents directory."""
    documents = []
    if not docs_dir.exists():
        logger.error("Medical documents directory not found: %s", docs_dir)
        return documents

    for txt_file in sorted(docs_dir.glob("*.txt")):
        logger.info("Loading: %s", txt_file.name)
        content = txt_file.read_text(encoding="utf-8")
        documents.append({"text": content, "source": txt_file.name})
        logger.info("  -> %d characters loaded", len(content))

    return documents


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def build_index(documents: List[Dict[str, str]]) -> bool:
    """Build FAISS index from documents."""
    # Collect all chunks with metadata
    all_chunks = []
    all_metadata = []

    for doc in documents:
        chunks = chunk_text(doc["text"])
        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_metadata.append({
                "text": chunk,
                "source": doc["source"],
                "chunk_index": i,
            })

    logger.info("Total chunks created: %d", len(all_chunks))
    if not all_chunks:
        logger.error("No text chunks to index.")
        return False

    # Try to use sentence-transformers for embeddings
    try:
        from sentence_transformers import SentenceTransformer
        import numpy as np
        import faiss

        logger.info("Loading sentence-transformer model (this may take a moment)...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Model loaded. Generating embeddings...")

        embeddings = model.encode(all_chunks, show_progress_bar=True, convert_to_numpy=True)
        logger.info("Embeddings shape: %s", embeddings.shape)

        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings)

        dimension = embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)
        logger.info("FAISS index built with %d vectors of dimension %d.", index.ntotal, dimension)

        # Save
        VECTOR_DB_DIR.mkdir(parents=True, exist_ok=True)
        faiss.write_index(index, str(INDEX_PATH))
        logger.info("Index saved to: %s", INDEX_PATH)

        with open(METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump(all_metadata, f, indent=2, ensure_ascii=False)
        logger.info("Metadata saved to: %s", METADATA_PATH)

        return True

    except ImportError as e:
        logger.error("Required package not installed: %s", e)
        logger.info("Install with: pip install faiss-cpu sentence-transformers")
        return False
    except Exception as e:
        logger.error("Failed to build index: %s", e)
        return False


def main():
    logger.info("=" * 60)
    logger.info("RAG Index Builder - Healthcare Knowledge Base")
    logger.info("=" * 60)

    logger.info("Medical documents directory: %s", MEDICAL_DOCS_DIR)
    logger.info("Vector database directory: %s", VECTOR_DB_DIR)

    # Load documents
    documents = load_documents(MEDICAL_DOCS_DIR)
    if not documents:
        logger.error("No documents found. Place .txt files in: %s", MEDICAL_DOCS_DIR)
        sys.exit(1)

    logger.info("Loaded %d document(s).", len(documents))

    # Build index
    success = build_index(documents)
    if success:
        logger.info("RAG index built successfully!")
        logger.info("Total chunks indexed: see metadata at %s", METADATA_PATH)
    else:
        logger.error("RAG index build failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
