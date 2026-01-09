# F1 Betting Lifecycle Background Service - PowerShell Script
# Starts the automatic betting lifecycle management system

Write-Host "🏎️ F1 Betting Lifecycle Background Service" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green
Write-Host ""
Write-Host "This service will run every 5 minutes to:" -ForegroundColor Yellow
Write-Host "• Close markets automatically at race start" -ForegroundColor Cyan
Write-Host "• Settle bets after race results" -ForegroundColor Cyan  
Write-Host "• Generate new markets for next GP" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Red
Write-Host "=" * 50 -ForegroundColor Green
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if required packages are installed
Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow
try {
    python -c "import apscheduler" 2>$null
    Write-Host "✅ APScheduler found" -ForegroundColor Green
} catch {
    Write-Host "❌ APScheduler not found. Installing..." -ForegroundColor Red
    pip install APScheduler==3.10.4
}

# Start the betting lifecycle service
Write-Host "🚀 Starting betting lifecycle service..." -ForegroundColor Green
try {
    python start_betting_lifecycle.py
} catch {
    Write-Host "❌ Error starting service: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "🛑 Service stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
