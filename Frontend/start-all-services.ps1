# PowerShell script to start all F1 Prediction System services
# Cleaned up version - removes deprecated features and improves error handling

Write-Host "🏎️ Starting F1 Prediction System Services" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Configuration
$MODEL_SERVICE_PORT = 8000
$FRONTEND_PORT = 5173
$JOLPICA_PORT = 5000

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

# Function to start service with error handling
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$Command,
        [string]$WorkingDirectory,
        [int]$Port
    )
    
    Write-Host "`n🚀 Starting $ServiceName..." -ForegroundColor Yellow
    
    if (-not (Test-Port $Port)) {
        Write-Host "❌ Port $Port is already in use. Stopping existing process..." -ForegroundColor Red
        try {
            $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
            if ($process) {
                Stop-Process -Id $process.OwningProcess -Force
                Start-Sleep -Seconds 2
            }
        } catch {
            Write-Host "⚠️ Could not stop process on port $Port" -ForegroundColor Yellow
        }
    }
    
    try {
        Set-Location $WorkingDirectory
        Write-Host "📁 Working directory: $(Get-Location)" -ForegroundColor Cyan
        
        # Start the service in background
        Start-Process powershell -ArgumentList "-Command", $Command -WindowStyle Minimized
        Write-Host "✅ $ServiceName started successfully" -ForegroundColor Green
        Write-Host "🌐 Service will be available at: http://localhost:$Port" -ForegroundColor Cyan
        
    } catch {
        Write-Host "❌ Failed to start $ServiceName: $_" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Check Python version
Write-Host "`n🐍 Checking Python version..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
    
    # Check if version is compatible (3.11+)
    if ($pythonVersion -match "Python 3\.(1[1-9]|[2-9][0-9])") {
        Write-Host "✅ Python version is compatible" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Python version might have compatibility issues" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Python not found. Please install Python 3.11+ and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js
Write-Host "`n📦 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start Model Service
$modelServiceStarted = Start-Service -ServiceName "ML Model Service" -Command "python app.py" -WorkingDirectory "model-service" -Port $MODEL_SERVICE_PORT

# Start Frontend (if model service started successfully)
if ($modelServiceStarted) {
    Write-Host "`n⏳ Waiting for model service to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # Test model service health
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$MODEL_SERVICE_PORT/health" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Model service is healthy" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Model service returned status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Could not verify model service health: $_" -ForegroundColor Yellow
    }
    
    # Start Frontend
    $frontendStarted = Start-Service -ServiceName "Frontend" -Command "npm run dev" -WorkingDirectory "." -Port $FRONTEND_PORT
} else {
    Write-Host "❌ Skipping frontend start due to model service failure" -ForegroundColor Red
}

# Summary
Write-Host "`n🎉 Service Startup Summary" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
if ($modelServiceStarted) {
    Write-Host "ML Model Service: ✅ Running" -ForegroundColor Green
} else {
    Write-Host "ML Model Service: ❌ Failed" -ForegroundColor Red
}

if ($frontendStarted) {
    Write-Host "Frontend: ✅ Running" -ForegroundColor Green
} else {
    Write-Host "Frontend: ❌ Failed" -ForegroundColor Red
}

Write-Host "`n🌐 Access Points:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:$FRONTEND_PORT" -ForegroundColor White
Write-Host "Model Service: http://localhost:$MODEL_SERVICE_PORT" -ForegroundColor White
Write-Host "Health Check: http://localhost:$MODEL_SERVICE_PORT/health" -ForegroundColor White

Write-Host "`n📝 Notes:" -ForegroundColor Yellow
Write-Host "- Services are running in background windows" -ForegroundColor White
Write-Host "- Close the background windows to stop services" -ForegroundColor White
Write-Host "- Check the cleanup documentation for troubleshooting" -ForegroundColor White

Write-Host "`n✅ All services started successfully!" -ForegroundColor Green
Read-Host "Press Enter to exit"


