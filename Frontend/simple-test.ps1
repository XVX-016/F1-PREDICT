Write-Host "Testing F1 Predict App Deployment" -ForegroundColor Green

$url = "https://f1-predict-main-27lhiau44-tanmmays-projects.vercel.app"

try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Manual test: Open $url in your browser" -ForegroundColor Yellow
