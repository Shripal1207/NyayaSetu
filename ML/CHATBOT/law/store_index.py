"""
One-time ingestion script for the RAG chatbot.

Reads every PDF inside ML/CHATBOT/law/Data/, splits the text into chunks,
embeds each chunk with Gemini text-embedding-004, and stores the resulting
vectors in a local FAISS index at ML/CHATBOT/law/faiss_index/.

Usage:
    cd ML/CHATBOT/law
    python store_index.py
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS

from src.helper import get_gemini_embeddings, load_pdf_file, text_split


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "Data"
INDEX_DIR = BASE_DIR / "faiss_index"


def main() -> None:
    load_dotenv()

    if not os.environ.get("GOOGLE_API_KEY"):
        raise SystemExit(
            "GOOGLE_API_KEY is not set. Add it to ML/CHATBOT/law/.env "
            "(get a free key at https://aistudio.google.com/apikey)."
        )

    if not DATA_DIR.exists() or not any(DATA_DIR.glob("*.pdf")):
        raise SystemExit(
            f"No PDFs found in {DATA_DIR}. "
            "Drop your legal PDF files there and re-run this script."
        )

    print(f"Loading PDF files from {DATA_DIR}...")
    extracted_data = load_pdf_file(str(DATA_DIR))
    print(f"Loaded {len(extracted_data)} document pages")

    print("Splitting text into chunks...")
    text_chunks = text_split(extracted_data)
    print(f"Created {len(text_chunks)} text chunks")

    print("Initializing Gemini embeddings (text-embedding-004)...")
    embeddings = get_gemini_embeddings()

    print("Building FAISS index from chunks (this calls the Gemini embeddings API)...")
    vectorstore = FAISS.from_documents(documents=text_chunks, embedding=embeddings)

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    vectorstore.save_local(str(INDEX_DIR))
    print(f"FAISS index saved to {INDEX_DIR}")
    print("\nSetup complete. You can now run: python app.py")


if __name__ == "__main__":
    main()
