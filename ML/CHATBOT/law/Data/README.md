# Place your legal PDFs here

Drop any number of `.pdf` files into this folder, then build the FAISS index:

```bash
cd ML/CHATBOT/law
python store_index.py
```

The script will:

1. Read every `*.pdf` in `Data/`.
2. Split each PDF into ~500-character chunks (with 20-char overlap).
3. Embed every chunk with Google Gemini `text-embedding-004`.
4. Save a local FAISS index to `ML/CHATBOT/law/faiss_index/`.

After indexing finishes, start the chatbot backend:

```bash
python app.py
```

The chatbot will answer using ONLY the content of these PDFs (plus the
LLM's general knowledge as fallback when no PDFs are indexed).

Suggested seed PDFs (public, free):

- Indian Penal Code (IPC) bare act
- Code of Criminal Procedure (CrPC) bare act
- Bharatiya Nyaya Sanhita (BNS) bare act
- Consumer Protection Act, 2019
- Information Technology Act, 2000
