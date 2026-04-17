# LegalNexus - Run complete project
# Run this script from the LegalNexus root folder in PowerShell.
# Open 3 separate terminals and run one command from each section below,
# OR run the first two in background and the third in foreground.

# ========== 1. Backend (Node) - Port 5001 ==========
# Terminal 1:
#   cd backend
#   $env:PORT="5001"
#   npm start

# ========== 2. Frontend (Vite) - Port 5100 ==========
# Terminal 2:
#   cd frontend
#   npm run dev

# ========== 3. Document Analyzer (Flask) - Port 7861 ==========
# Terminal 3 (requires Python, and GOOGLE_API_KEY in ML/AI_DOC_ANALYSER/.env):
#   cd ML\AI_DOC_ANALYSER
#   $env:PORT="7861"
#   pip install -r requirements.txt
#   python app.py

Write-Host "LegalNexus - Run instructions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open 3 PowerShell/terminal windows and run:"
Write-Host ""
Write-Host "Terminal 1 - Backend:" -ForegroundColor Yellow
Write-Host "  cd $PSScriptRoot\backend"
Write-Host "  `$env:PORT='5001'; npm start"
Write-Host ""
Write-Host "Terminal 2 - Frontend:" -ForegroundColor Yellow
Write-Host "  cd $PSScriptRoot\frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Terminal 3 - Document Analyzer (optional):" -ForegroundColor Yellow
Write-Host "  cd $PSScriptRoot\ML\AI_DOC_ANALYSER"
Write-Host "  `$env:PORT='7861'; pip install -r requirements.txt; python app.py"
Write-Host ""
Write-Host "Then open: http://localhost:5100" -ForegroundColor Green
Write-Host "Backend API: http://localhost:5001" -ForegroundColor Green
Write-Host ""
Write-Host "Ensure backend\.env has MONGO_URI (optional) and ALLOWED_ORIGINS including http://localhost:5100" -ForegroundColor Gray
Write-Host "Ensure ML\AI_DOC_ANALYSER\.env has GOOGLE_API_KEY for document analysis" -ForegroundColor Gray
