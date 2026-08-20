"""
RAG (Retrieval-Augmented Generation) pipeline for building a FAISS vector index
from medical text documents.

All file paths use pathlib for Windows compatibility.
"""
import json
import logging
from pathlib import Path
from typing import List, Optional

from langchain_community.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

# ── Defaults ────────────────────────────────────────────────────────────

DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 200
DEFAULT_SOURCE_DIR_NAME = "medical_documents"
DEFAULT_INDEX_DIR_NAME = "vector_database"


# ── Document loading ────────────────────────────────────────────────────

def load_text_documents(source_dir: Path) -> List[Document]:
    """
    Recursively load all ``.txt`` files from *source_dir*.
    Returns a list of LangChain Document objects.
    """
    documents: List[Document] = []
    if not source_dir.exists():
        logger.warning("Source directory does not exist: %s", source_dir)
        return documents

    for txt_file in sorted(source_dir.rglob("*.txt")):
        try:
            text = txt_file.read_text(encoding="utf-8")
            if text.strip():
                doc = Document(
                    page_content=text,
                    metadata={"source": str(txt_file.relative_to(source_dir))},
                )
                documents.append(doc)
                logger.info("Loaded: %s (%d chars)", txt_file.name, len(text))
        except Exception as exc:
            logger.warning("Failed to read %s: %s", txt_file, exc)

    logger.info("Total documents loaded: %d", len(documents))
    return documents


# ── Text chunking ───────────────────────────────────────────────────────

def chunk_documents(
    documents: List[Document],
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> List[Document]:
    """Split documents into smaller chunks for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )
    chunks = splitter.split_documents(documents)
    logger.info("Created %d chunks from %d documents.", len(chunks), len(documents))
    return chunks


# ── Embedding + FAISS index ─────────────────────────────────────────────

def build_faiss_index(
    chunks: List[Document],
    output_index_path: Path,
    output_metadata_path: Path,
) -> bool:
    """
    Generate embeddings and build a FAISS index.
    Saves the index and metadata (chunk texts + sources) to disk.
    Returns True on success.
    """
    if not chunks:
        logger.warning("No chunks to embed.")
        return False

    try:
        from langchain_community.vectorstores import FAISS
        from langchain_openai import OpenAIEmbeddings

        from app.core.config import settings

        embeddings = OpenAIEmbeddings(
            api_key=settings.OPENAI_API_KEY,
            model="text-embedding-ada-002",
        )

        # Build the FAISS index from documents
        vectorstore = FAISS.from_documents(chunks, embeddings)

        # Ensure output directories exist
        output_index_path.parent.mkdir(parents=True, exist_ok=True)

        # Save the FAISS index
        vectorstore.save_local(str(output_index_path.parent))
        # FAISS save_local creates index.faiss and index.pkl in the given directory
        # Rename/move to desired paths
        faiss_default = output_index_path.parent / "index.faiss"
        if faiss_default.exists():
            import shutil
            shutil.copy2(str(faiss_default), str(output_index_path))

        logger.info("FAISS index saved to: %s", output_index_path)

        # Save metadata
        metadata = [
            {"text": chunk.page_content, "source": chunk.metadata.get("source", "")}
            for chunk in chunks
        ]
        output_metadata_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        logger.info("Metadata saved to: %s (%d entries)", output_metadata_path, len(metadata))
        return True

    except ImportError as exc:
        logger.error("Missing package for FAISS/embedding: %s", exc)
        return False
    except Exception as exc:
        logger.error("Failed to build FAISS index: %s", exc)
        return False


# ── Full pipeline ───────────────────────────────────────────────────────

def run_pipeline(
    source_dir: Optional[Path] = None,
    output_index_path: Optional[Path] = None,
    output_metadata_path: Optional[Path] = None,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> bool:
    """
    Run the complete RAG pipeline: load → chunk → embed → save.
    """
    from app.core.config import BASE_DIR, settings

    source_dir = source_dir or (BASE_DIR.parent / DEFAULT_SOURCE_DIR_NAME)
    output_index_path = output_index_path or settings.rag_index_path
    output_metadata_path = output_metadata_path or settings.rag_metadata_path

    logger.info("=== RAG Pipeline Start ===")
    logger.info("Source dir : %s", source_dir)
    logger.info("Index path : %s", output_index_path)
    logger.info("Metadata   : %s", output_metadata_path)

    documents = load_text_documents(source_dir)
    if not documents:
        logger.error("No documents found.  Aborting pipeline.")
        return False

    chunks = chunk_documents(documents, chunk_size, chunk_overlap)
    if not chunks:
        logger.error("No chunks generated.  Aborting pipeline.")
        return False

    success = build_faiss_index(chunks, output_index_path, output_metadata_path)
    if success:
        logger.info("=== RAG Pipeline Complete ===")
    else:
        logger.error("=== RAG Pipeline Failed ===")
    return success
