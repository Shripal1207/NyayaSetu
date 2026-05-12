---
title: NyaySetu RAG Chatbot
emoji: ⚖️
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
license: mit
---

# NyaySetu - RAG Legal Chatbot

AI-powered legal chatbot for Indian law using Google Gemini (LLM + embeddings)
and a local FAISS vector store.

## Stack

- **LLM:** Google Gemini `gemini-2.5-flash` via `langchain-google-genai`
- **Embeddings:** Google Gemini `text-embedding-004` (768-dim)
- **Vector DB:** FAISS (local, persisted under `faiss_index/`)
- **Server:** Flask + flask-cors

## Setup

```bash
cd ML/CHATBOT/law
python -m venv venv
venv\Scripts\activate           # Windows
# source venv/bin/activate      # macOS/Linux
pip install -r requirements.txt

cp .env.production.template .env
# Edit .env: set GOOGLE_API_KEY (https://aistudio.google.com/apikey)

# Drop legal PDFs into Data/, then build the local FAISS index:
python store_index.py

# Run the API:
python app.py
```

The API listens on `http://localhost:5001` by default (matches the
Vite proxy in `frontend/vite.config.js`).

## API Endpoints

| Method | Path                     | Purpose                                |
|--------|--------------------------|----------------------------------------|
| POST   | `/api/chat`              | Send `{"msg": "..."}`, get a reply     |
| GET    | `/api/chat/health`       | Health + model/index info              |
| GET    | `/api/chat/diagnose`     | Verify Gemini API key is working       |
| GET    | `/api/chat/ping`         | Liveness probe                         |
| GET    | `/api/health`            | Liveness probe (alias)                 |
| POST   | `/api/chat/clear`        | Clear session chat history             |
