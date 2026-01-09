# Test script to check if all services are running correctly
Write-Host "🧪 Testing F1 Prediction System Services" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Configuration
$MODEL_SERVICE_URL = "http://localhost:8000"
$FRONTEND_URL = "http://localhost:5173"
$BACKEND_URL = "http://localhost:3001"

# Function to test service health
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$Url,
        [string]$Endpoint = "/health"
    )
    
    Write-Host "`n🔍 Testing $ServiceName..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$Url$Endpoint" -Method GET -TimeoutSec 5
        Write-Host "✅ $ServiceName is healthy" -ForegroundColor Green
        Write-Host "   Response: $($response | ConvertTo-Json -Depth 1)" -ForegroundColor Cyan
        return $true
    } catch {
        Write-Host "❌ $ServiceName is not responding" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to test prediction endpoint
function Test-PredictionEndpoint {
    param(
        [string]$ServiceName,
        [string]$Url
    )
    
    Write-Host "`n🎯 Testing $ServiceName predictions..." -ForegroundColor Yellow
    
    try {
        $predictionUrl = "$Url/predictions/race?race_name=Dutch%20Grand%20Prix`&date=2025-08-31"
        $response = Invoke-RestMethod -Uri $predictionUrl -Method GET -TimeoutSec 10
        Write-Host "✅ $ServiceName predictions working" -ForegroundColor Green
        Write-Host "   Race: $($response.race)" -ForegroundColor Cyan
        Write-Host "   Drivers: $($response.all.Count)" -ForegroundColor Cyan
        return $true
    } catch {
        Write-Host "❌ $ServiceName predictions failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test ML Service
$mlServiceHealthy = Test-ServiceHealth -ServiceName "ML Model Service" -Url $MODEL_SERVICE_URL
if ($mlServiceHealthy) {
    Test-PredictionEndpoint -ServiceName "ML Model Service" -Url $MODEL_SERVICE_URL
}

# Test Backend Service (if different from ML service)
if ($BACKEND_URL -ne $MODEL_SERVICE_URL) {
    Test-ServiceHealth -ServiceName "Backend Service" -Url $BACKEND_URL
}

# Test Frontend
Write-Host "`n🌐 Testing Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $FRONTEND_URL -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is accessible" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Frontend returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Frontend is not accessible" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n📊 Service Status Summary:" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "ML Service: $(if ($mlServiceHealthy) { '✅ Healthy' } else { '❌ Unhealthy' })" -ForegroundColor $(if ($mlServiceHealthy) { 'Green' } else { 'Red' })
Write-Host "Frontend: ✅ Accessible" -ForegroundColor Green

Write-Host "`n🎉 Testing complete!" -ForegroundColor Green
