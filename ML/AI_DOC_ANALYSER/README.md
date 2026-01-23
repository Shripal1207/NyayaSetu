---
title: LegalNexus Document Analyzer
emoji: 📄
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
license: mit
---

# LegalNexus Document Analyzer

AI-powered legal document analysis service using Gemini API and local embeddings.

## Features
- PDF document upload and processing
- Legal document explanation in multiple languages
- Question-answering based on document content
- FAISS vector store for efficient retrieval

## API Endpoints
- `POST /upload` - Upload PDF documents
- `GET /explain` - Get document explanation
- `POST /ask` - Ask questions about the document
- `GET /health` - Health check
