# LegalNexus – NyaySetu RAG Chatbot

A retrieval-augmented Indian-law chatbot. Everything runs on **Google Gemini**:

- **LLM:** `gemini-2.5-flash`
- **Embeddings:** `text-embedding-004`
- **Vector DB:** FAISS (local, persisted in `ML/CHATBOT/law/faiss_index/`)
- **Server:** Flask + flask-cors (Python)
- **UI:** Vite + React

Project layout:

```
LegalNexus/
├── ML/CHATBOT/law/        # Flask RAG backend (Gemini + FAISS)
│   ├── app.py             # /api/chat endpoint
│   ├── store_index.py     # Builds FAISS index from PDFs in Data/
│   ├── src/helper.py      # Embeddings, PDF loader, text splitter
│   ├── Data/              # <-- Drop your legal PDFs here
│   ├── faiss_index/       # Auto-generated after store_index.py
│   ├── requirements.txt
│   └── .env.production.template
├── frontend/              # React UI (port 5100)
│   ├── src/pages/ChatbotPage.jsx
│   └── ...
├── evaluation/            # Chatbot evaluation scripts
├── HOW-TO-RUN.md
└── run-all.ps1
```

---

## One-time setup

### 1. Backend (Flask, port 5001)

```powershell
cd ML\CHATBOT\law

# Create a virtual environment (recommended)
python -m venv venv
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt

# Copy the env template and add your key
Copy-Item .env.production.template .env
notepad .env     # set GOOGLE_API_KEY (get one at https://aistudio.google.com/apikey)
```

### 2. Add your legal PDFs

Drop one or more `.pdf` files into `ML/CHATBOT/law/Data/`.
Examples: IPC, CrPC, BNS, Consumer Protection Act, IT Act.

### 3. Build the FAISS index (one time, or whenever PDFs change)

```powershell
cd ML\CHATBOT\law
python store_index.py
```

This reads every PDF in `Data/`, splits into 500-char chunks, embeds each
chunk with Gemini `text-embedding-004`, and saves a local FAISS index to
`faiss_index/`. Re-run any time you add/remove PDFs.

### 4. Frontend (Vite + React, port 5100)

```powershell
cd frontend
npm install
```

---

## Run the project

Open **two** PowerShell windows from the project root.

**Terminal 1 – RAG backend:**

```powershell
cd ML\CHATBOT\law
.\venv\Scripts\Activate.ps1
python app.py
```

The backend listens on `http://localhost:5001` and prints:

```
[OK] FAISS retriever ready
[OK] LLM ready
[START] Starting NyaySetu RAG backend...
```

If you skipped step 3 (no PDFs indexed yet) you'll instead see
`[WARN] No FAISS index found...`. The chatbot will still answer, but
without document grounding.

**Terminal 2 – Frontend:**

```powershell
cd frontend
npm run dev
```

Open **http://localhost:5100** in your browser.

---

## How RAG flows end-to-end

```
User question
  -> React UI (ChatbotPage)
  -> POST /api/chat  (Vite proxy -> Flask on 5001)
  -> Flask app.py
       -> Gemini embeddings (query vector)
       -> FAISS similarity search (top-6 chunks)
       -> Prompt = system + retrieved context + chat history + question
       -> Gemini 2.5 Flash
  -> JSON {"response": "..."}
  -> React renders the answer
```

---

## Health checks

- `GET http://localhost:5001/api/chat/health`   – status + model info
- `GET http://localhost:5001/api/chat/diagnose` – verifies your Gemini key works
- `GET http://localhost:5001/api/health`        – simple liveness probe

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `GOOGLE_API_KEY is not set` on startup | Add the key to `ML/CHATBOT/law/.env`, restart |
| `No FAISS index found` warning | Put PDFs into `Data/`, run `python store_index.py` |
| Frontend says "service unavailable" | Make sure Flask is running on port 5001 |
| CORS error in browser | Add your frontend URL to `ALLOWED_ORIGINS` in `.env` |
| Quota / 429 from Gemini | Wait a minute; or upgrade your Google AI Studio tier |
