# PowerShell script to start local F1 services
# This script starts both Jolpica API and Fast-F1 services locally

Write-Host "🚀 Starting Local F1 Services..." -ForegroundColor Green

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Function to wait for a service to be ready
function Wait-ForService {
    param([int]$Port, [string]$ServiceName)
    Write-Host "⏳ Waiting for $ServiceName to be ready on port $Port..." -ForegroundColor Yellow
    $attempts = 0
    $maxAttempts = 30
    
    while ($attempts -lt $maxAttempts) {
        if (Test-Port $Port) {
            Write-Host "✅ $ServiceName is ready on port $Port" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 2
        $attempts++
        Write-Host "  Attempt $attempts/$maxAttempts..." -ForegroundColor Gray
    }
    
    Write-Host "❌ $ServiceName failed to start on port $Port" -ForegroundColor Red
    return $false
}

# Check if Python 3.12 is available
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python 3\.12") {
        Write-Host "✅ Python 3.12 found: $pythonVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Python 3.12 not found. Found: $pythonVersion" -ForegroundColor Yellow
        Write-Host "   Please install Python 3.12 for Jolpica compatibility" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Python not found. Please install Python 3.12" -ForegroundColor Red
    exit 1
}

# Start Jolpica API (Port 5000)
Write-Host "`n🏁 Starting Jolpica F1 API..." -ForegroundColor Cyan

if (Test-Port 5000) {
    Write-Host "⚠️  Port 5000 is already in use. Jolpica may already be running." -ForegroundColor Yellow
} else {
    # Start Jolpica in a new PowerShell window
    $jolpicaScript = @"
        cd '$PSScriptRoot\services\jolpica-f1'
        Write-Host 'Starting Jolpica F1 API...' -ForegroundColor Green
        if (Test-Path '.venv\Scripts\Activate.ps1') {
            .\.venv\Scripts\Activate.ps1
            python manage.py runserver 0.0.0.0:5000
        } else {
            Write-Host 'Virtual environment not found. Please run setup first.' -ForegroundColor Red
            pause
        }
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $jolpicaScript -WindowStyle Normal
    Write-Host "📝 Jolpica API starting in new window..." -ForegroundColor Cyan
}

# Wait for Jolpica to be ready
if (Wait-ForService 5000 "Jolpica API") {
    Write-Host "✅ Jolpica API is running on http://localhost:5000" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start Jolpica API" -ForegroundColor Red
}

# Start Fast-F1 service (Port 8000)
Write-Host "`n⚡ Starting Fast-F1 Service..." -ForegroundColor Cyan

if (Test-Port 8000) {
    Write-Host "⚠️  Port 8000 is already in use. Fast-F1 may already be running." -ForegroundColor Yellow
} else {
    # Start Fast-F1 in a new PowerShell window
    $fastF1Script = @"
        cd '$PSScriptRoot\services\Fast-F1'
        Write-Host 'Starting Fast-F1 Service...' -ForegroundColor Green
        if (Test-Path '..\jolpica-f1\.venv\Scripts\Activate.ps1') {
            ..\jolpica-f1\.venv\Scripts\Activate.ps1
            python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
        } else {
            Write-Host 'Virtual environment not found. Please run setup first.' -ForegroundColor Red
            pause
        }
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $fastF1Script -WindowStyle Normal
    Write-Host "📝 Fast-F1 service starting in new window..." -ForegroundColor Cyan
}

# Wait for Fast-F1 to be ready
if (Wait-ForService 8000 "Fast-F1 Service") {
    Write-Host "✅ Fast-F1 service is running on http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start Fast-F1 service" -ForegroundColor Red
}

# Summary
Write-Host "`n🎯 Local Services Summary:" -ForegroundColor Green
Write-Host "   Jolpica API: http://localhost:5000" -ForegroundColor White
Write-Host "   Fast-F1 Service: http://localhost:8000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173 (run 'npm run dev' in project folder)" -ForegroundColor White

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Ensure both services are running without errors" -ForegroundColor White
Write-Host "   2. Open a new terminal and run: cd project && npm run dev" -ForegroundColor White
Write-Host "   3. Navigate to the Predict page to test local API integration" -ForegroundColor White

Write-Host "`n🔍 To check service status:" -ForegroundColor Cyan
Write-Host "   - Jolpica: http://localhost:5000/ergast/f1/2025/drivers" -ForegroundColor Gray
Write-Host "   - Fast-F1: http://localhost:8000/health" -ForegroundColor Gray

Write-Host "`n⏹️  To stop services: Close the PowerShell windows or use Ctrl+C" -ForegroundColor Yellow
