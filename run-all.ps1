# LegalNexus NyaySetu - Run the project
# Run this script from the LegalNexus root folder in PowerShell.

Write-Host "LegalNexus NyaySetu (RAG + Gemini) - Run instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open 2 PowerShell windows and run:"
Write-Host ""
Write-Host "Terminal 1 - RAG Backend (Flask, port 5001):" -ForegroundColor Yellow
Write-Host "  cd $PSScriptRoot\ML\CHATBOT\law"
Write-Host "  .\venv\Scripts\Activate.ps1     # if you created a venv"
Write-Host "  python app.py"
Write-Host ""
Write-Host "Terminal 2 - Frontend (Vite, port 5100):" -ForegroundColor Yellow
Write-Host "  cd $PSScriptRoot\frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then open: http://localhost:5100" -ForegroundColor Green
Write-Host "Backend API: http://localhost:5001" -ForegroundColor Green
Write-Host ""
Write-Host "First-time setup:" -ForegroundColor Magenta
Write-Host "  1) cd ML\CHATBOT\law"
Write-Host "  2) python -m venv venv; .\venv\Scripts\Activate.ps1"
Write-Host "  3) pip install -r requirements.txt"
Write-Host "  4) Copy-Item .env.production.template .env  (then add GOOGLE_API_KEY)"
Write-Host "  5) Drop legal PDFs into Data/, run: python store_index.py"
Write-Host ""
Write-Host "Get a free Gemini API key at: https://aistudio.google.com/apikey" -ForegroundColor Gray
