# PowerShell script to start ML Model Service
Write-Host "🤖 Starting ML Model Service" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Configuration
$MODEL_SERVICE_PORT = 8000
$WORKING_DIR = "model-service"

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $connection -eq $null
    } catch {
        return $true
    }
}

# Function to kill process on port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "🛑 Stopping existing process on port $Port..." -ForegroundColor Yellow
            Stop-Process -Id $process.OwningProcess -Force
            Start-Sleep -Seconds 2
        }
    } catch {
        Write-Host "⚠️ Could not stop process on port $Port" -ForegroundColor Yellow
    }
}

# Check Python version
Write-Host "`n🐍 Checking Python version..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+ and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if working directory exists
if (-not (Test-Path $WORKING_DIR)) {
    Write-Host "❌ Working directory '$WORKING_DIR' not found!" -ForegroundColor Red
    Write-Host "   Make sure you're running this script from the project root." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if app.py exists
if (-not (Test-Path "$WORKING_DIR/app.py")) {
    Write-Host "❌ app.py not found in $WORKING_DIR!" -ForegroundColor Red
    Write-Host "   Make sure the ML service files are present." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if requirements.txt exists
if (-not (Test-Path "$WORKING_DIR/requirements.txt")) {
    Write-Host "❌ requirements.txt not found in $WORKING_DIR!" -ForegroundColor Red
    Write-Host "   Make sure the ML service files are present." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if virtual environment exists
$venvPath = "$WORKING_DIR/.venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "`n📦 Creating virtual environment..." -ForegroundColor Yellow
    try {
        Set-Location $WORKING_DIR
        python -m venv .venv
        Write-Host "✅ Virtual environment created" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create virtual environment: $_" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Activate virtual environment and install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
try {
    Set-Location $WORKING_DIR
    
    # Activate virtual environment
    if ($IsWindows) {
        & ".venv\Scripts\Activate.ps1"
    } else {
        & ".venv/bin/Activate.ps1"
    }
    
    # Install requirements
    pip install -r requirements.txt
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if port is available
if (-not (Test-Port $MODEL_SERVICE_PORT)) {
    Write-Host "`n⚠️ Port $MODEL_SERVICE_PORT is already in use." -ForegroundColor Yellow
    $choice = Read-Host "Do you want to stop the existing process? (y/n)"
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        Stop-ProcessOnPort $MODEL_SERVICE_PORT
    } else {
        Write-Host "❌ Cannot start service. Port $MODEL_SERVICE_PORT is in use." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Start the ML service
Write-Host "`n🚀 Starting ML Model Service..." -ForegroundColor Yellow
try {
    Set-Location $WORKING_DIR
    
    # Activate virtual environment
    if ($IsWindows) {
        & ".venv\Scripts\Activate.ps1"
    } else {
        & ".venv/bin/Activate.ps1"
    }
    
    # Set environment variables
    $env:FLASK_ENV = "development"
    $env:FLASK_DEBUG = "1"
    $env:PORT = $MODEL_SERVICE_PORT
    
    # Start the service
    Write-Host "🌐 Service will be available at: http://localhost:$MODEL_SERVICE_PORT" -ForegroundColor Cyan
    Write-Host "📊 Health check: http://localhost:$MODEL_SERVICE_PORT/health" -ForegroundColor Cyan
    Write-Host "🎯 Predictions: http://localhost:$MODEL_SERVICE_PORT/predictions/race" -ForegroundColor Cyan
    Write-Host "`n🔄 Starting Flask app..." -ForegroundColor Green
    
    python app.py
    
} catch {
    Write-Host "❌ Failed to start ML service: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

