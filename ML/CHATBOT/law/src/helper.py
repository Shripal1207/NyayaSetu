import os

from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


def load_pdf_file(data: str):
    """Extract data from all PDF files in a directory."""
    loader = DirectoryLoader(
        data,
        glob="*.pdf",
        loader_cls=PyPDFLoader,
    )
    return loader.load()


def text_split(extracted_data):
    """Split documents into ~500-char chunks with 20-char overlap."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=20,
    )
    return text_splitter.split_documents(extracted_data)


def get_gemini_embeddings():
    """
    Build a Gemini embeddings client using GOOGLE_API_KEY from the environment.
    Model: text-embedding-004 (768-dim).
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY is not set. Add it to ML/CHATBOT/law/.env. "
            "Get a free key at https://aistudio.google.com/apikey"
        )

    return GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=api_key,
    )
