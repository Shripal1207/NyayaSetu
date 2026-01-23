---
title: LegalNexus LawBot Chatbot
emoji: ⚖️
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
license: mit
---

# LegalNexus LawBot

AI-powered legal chatbot for Indian law using Groq LLM and Pinecone vector store.

## Features
- Conversational AI for Indian legal queries
- Uses llama-3.3-70b model via Groq
- Pinecone vector store for legal document retrieval
- Session-based chat history

## API Endpoints
- `POST /get` - Send message and get response
- `GET /chat_history` - Get conversation history
- `POST /chat/clear` - Clear chat history
- `GET /health` - Health check
