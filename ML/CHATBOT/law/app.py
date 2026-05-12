"""
NyaySetu RAG chatbot backend.

Stack:
    LLM:        Google Gemini (gemini-2.5-flash) via langchain-google-genai
    Embeddings: Google Gemini text-embedding-004 via langchain-google-genai
    Vector DB:  FAISS (local, no API keys, persisted under ./faiss_index/)
    Server:     Flask + flask-cors (single backend for the React frontend)

Exposes:
    POST /api/chat               body: {"msg": "..."}     -> {"response": "..."}
    GET  /api/chat/health        -> {"status": "OK", ...}
    GET  /api/chat/diagnose      -> quick Gemini connectivity check
    GET  /api/chat/ping          -> liveness probe
    GET  /api/health             -> liveness probe
    POST /api/chat/clear         -> clears the in-memory session history
"""

from __future__ import annotations

import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from dotenv import load_dotenv
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_community.vectorstores import FAISS
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from src.helper import get_gemini_embeddings


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
load_dotenv()

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "").strip()
if not GOOGLE_API_KEY:
    raise SystemExit(
        "GOOGLE_API_KEY is not set. Add it to ML/CHATBOT/law/.env "
        "(get a free key at https://aistudio.google.com/apikey)."
    )

BASE_DIR = Path(__file__).resolve().parent
INDEX_DIR = BASE_DIR / "faiss_index"
TOP_K = 6
LLM_MODEL = "gemini-2.5-flash"

# Allowed frontend origins (comma-separated). Default keeps the Vite dev server.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:5100,http://127.0.0.1:5100",
    ).split(",")
    if origin.strip()
]


# ---------------------------------------------------------------------------
# Flask app + CORS
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or os.urandom(24)
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)


# ---------------------------------------------------------------------------
# RAG components: embeddings + FAISS retriever + Gemini LLM
# ---------------------------------------------------------------------------
print("[BOT] Loading Gemini embeddings (text-embedding-004)...")
embeddings = get_gemini_embeddings()
print("[OK] Embeddings ready")

retriever = None
if INDEX_DIR.exists() and any(INDEX_DIR.iterdir()):
    print(f"[CONNECT] Loading FAISS index from {INDEX_DIR}...")
    try:
        vectorstore = FAISS.load_local(
            str(INDEX_DIR),
            embeddings,
            allow_dangerous_deserialization=True,
        )
        retriever = vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": TOP_K},
        )
        print("[OK] FAISS retriever ready")
    except Exception as exc:
        print(f"[WARN] Failed to load FAISS index: {exc}")
        retriever = None
else:
    print(
        f"[WARN] No FAISS index found at {INDEX_DIR}. "
        "RAG context will be empty until you add PDFs to Data/ and run store_index.py."
    )

print(f"[BRAIN] Initializing Gemini LLM ({LLM_MODEL})...")
llm = ChatGoogleGenerativeAI(
    model=LLM_MODEL,
    google_api_key=GOOGLE_API_KEY,
    temperature=0.3,
)
print("[OK] LLM ready")


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are NyaySetu, a friendly AI Legal Assistant for Indian law.
Speak clearly and helpfully, like you're chatting with a friend - not a courtroom judge.

Your job:
1. Identify the relevant section(s) or act(s) (e.g. IPC, BNS, CrPC, CPC, Consumer Protection Act) the user can file under.
2. Explain those sections using the "Context from legal documents" below whenever possible.

How to answer:
- Applicable section(s): Clearly state the section / act. If the context mentions specific sections, use those.
- What the section says: Paraphrase or quote from the context. If the context does not contain the section text, say so and suggest the user consult the bare act or a lawyer.
- In simple words: 1-2 lines in everyday language explaining what it means for the user.
- Next steps: Suggest consulting a lawyer and where to find the full bare act (e.g. Indian Kanoon).

Rules:
- Use ONLY information from the context for section text. NEVER make up section numbers or invent text.
- Never give direct legal advice (e.g. "you will win"). Always recommend speaking to a qualified advocate.
- Use the chat history to remember details the user has already shared.

Context from legal documents:
{context}

Chat history:
{chat_history}

User question: {question}

Your response:"""

prompt = ChatPromptTemplate.from_template(SYSTEM_PROMPT)


# ---------------------------------------------------------------------------
# Per-session chat history (in-memory)
# ---------------------------------------------------------------------------
chat_histories: Dict[str, BaseChatMessageHistory] = {}


def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in chat_histories:
        chat_histories[session_id] = ChatMessageHistory()
    return chat_histories[session_id]


def format_chat_history(messages: List) -> str:
    formatted = []
    for msg in messages:
        if hasattr(msg, "type"):
            role = "Human" if msg.type == "human" else "AI"
            formatted.append(f"{role}: {msg.content}")
    return "\n".join(formatted[-6:])  # last 3 exchanges


def retrieve_context(question: str) -> str:
    if retriever is None:
        return ""
    try:
        docs = retriever.invoke(question)
        return "\n\n".join(doc.page_content for doc in docs)
    except Exception as exc:
        print(f"[ERROR] Retrieval failed: {exc}")
        return ""


def format_for_html(text: str) -> str:
    """Light formatting so the existing React UI renders nicely."""
    text = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", text)
    text = text.replace("\n", "<br>")
    return text.strip()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    msg = (data.get("msg") or "").strip()
    if not msg:
        return jsonify({"error": "Message is required."}), 400

    session_id = session.get("session_id")
    if not session_id:
        session_id = str(datetime.now().timestamp())
        session["session_id"] = session_id

    try:
        history = get_session_history(session_id)
        context = retrieve_context(msg)
        chat_history_text = format_chat_history(history.messages)

        formatted_prompt = prompt.format(
            context=context if context else "(no documents indexed)",
            chat_history=chat_history_text,
            question=msg,
        )

        response = llm.invoke(formatted_prompt)
        answer = response.content if hasattr(response, "content") else str(response)

        history.add_user_message(msg)
        history.add_ai_message(answer)

        return jsonify({"response": format_for_html(answer)})

    except Exception as exc:
        print(f"[ERROR] Chat request failed: {exc}")
        import traceback

        traceback.print_exc()
        msg_lower = str(exc).lower()
        if "api_key" in msg_lower or "permission" in msg_lower or "401" in msg_lower or "403" in msg_lower:
            user_msg = (
                "Invalid or restricted Gemini API key. Check your key at "
                "https://aistudio.google.com/apikey and ensure the Generative Language API is enabled."
            )
        elif "quota" in msg_lower or "429" in msg_lower:
            user_msg = "API quota exceeded. Please try again later."
        else:
            user_msg = "The AI Legal Assistant is temporarily unavailable. Please try again later."
        return (
            jsonify({"response": user_msg, "error": True, "serviceUnavailable": True}),
            500,
        )


@app.route("/api/chat/health", methods=["GET"])
def chat_health():
    return jsonify(
        {
            "status": "OK",
            "message": "NyaySetu RAG chatbot is running",
            "model": LLM_MODEL,
            "embeddings": "text-embedding-004",
            "vector_store": "FAISS (local)",
            "rag_enabled": retriever is not None,
            "active_sessions": len(chat_histories),
        }
    )


@app.route("/api/chat/diagnose", methods=["GET"])
def chat_diagnose():
    key_preview = f"{GOOGLE_API_KEY[:8]}...{GOOGLE_API_KEY[-4:]}"
    try:
        result = llm.invoke("Reply with one word: OK")
        text = result.content if hasattr(result, "content") else str(result)
        return jsonify(
            {
                "ok": True,
                "keyPreview": key_preview,
                "reply": text.strip(),
                "rag_enabled": retriever is not None,
            }
        )
    except Exception as exc:
        return jsonify(
            {
                "ok": False,
                "keyPreview": key_preview,
                "error": str(exc),
                "hint": "Fix the Gemini error above, then restart the backend.",
            }
        )


@app.route("/api/chat/ping", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def ping():
    return jsonify({"ok": True, "message": "NyaySetu backend is reachable"})


@app.route("/api/chat/clear", methods=["POST"])
def clear_chat():
    session_id = session.get("session_id")
    if session_id and session_id in chat_histories:
        del chat_histories[session_id]
        session["session_id"] = str(datetime.now().timestamp())
    return jsonify({"message": "Chat history cleared"})


@app.route("/", methods=["GET"])
def root():
    return jsonify({"status": "OK", "message": "NyaySetu RAG Chatbot API"})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print("\n[START] Starting NyaySetu RAG backend...")
    print(f"[URL] http://localhost:{port}")
    print(f"[HEALTH] http://localhost:{port}/api/chat/health")
    print(f"[DIAGNOSE] http://localhost:{port}/api/chat/diagnose")
    print()
    app.run(host="0.0.0.0", port=port, debug=False)
