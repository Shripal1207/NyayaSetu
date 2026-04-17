# LegalNexus – How to Run the Project

Open these files in Cursor to run the project:

## Required files to run

### Frontend (Vite + React, port 5100)
- `LegalNexus/frontend/package.json` – scripts & dependencies
- `LegalNexus/frontend/vite.config.js` – dev server & API proxy
- `LegalNexus/frontend/index.html` – entry HTML
- `LegalNexus/frontend/src/main.jsx` – React entry
- `LegalNexus/frontend/src/App.jsx` – routes & app shell

### Backend (Node + Express, port 5000)
- `LegalNexus/backend/package.json` – scripts & dependencies
- `LegalNexus/backend/server.js` – API server entry

### Environment (create from templates)
- `LegalNexus/frontend/.env.production.template` → copy to `LegalNexus/frontend/.env` or `.env.local` for dev
- `LegalNexus/backend/.env.production.template` → copy to `LegalNexus/backend/.env`

---

## Run locally

1. **Backend** (terminal 1):
   ```bash
   cd LegalNexus/backend
   cp .env.production.template .env
   # Edit .env: set MONGO_URI, JWT_SECRET, PORT=5001 (to match Vite proxy)
   npm install
   npm run dev
   ```

2. **Frontend** (terminal 2):
   ```bash
   cd LegalNexus/frontend
   npm install
   npm run dev
   ```

3. Open **http://localhost:5100** in the browser.

**Note:** `vite.config.js` proxies `/api` to `http://localhost:5001`. Run the backend with `PORT=5001` or set `PORT=5001` in `LegalNexus/backend/.env`.
