# Test Vercel Deployment
# This script tests if the deployed app is working correctly

Write-Host "🧪 Testing F1 Predict App Deployment" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

$deploymentUrl = "https://f1-predict-main-27lhiau44-tanmmays-projects.vercel.app"

Write-Host "🌐 Testing deployment URL: $deploymentUrl" -ForegroundColor Cyan

try {
    # Test if the main page loads
    Write-Host "📄 Testing main page..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri $deploymentUrl -UseBasicParsing -TimeoutSec 30
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Main page loads successfully (Status: $($response.StatusCode))" -ForegroundColor Green
        
        # Check if it's the correct content
        if ($response.Content -match "F1 Predict" -or $response.Content -match "React") {
            Write-Host "✅ Content appears to be correct" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Content might not be correct - check manually" -ForegroundColor Yellow
        }
        
        # Check response headers
        Write-Host "📊 Response Headers:" -ForegroundColor Cyan
        Write-Host "  Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor White
        Write-Host "  Content-Length: $($response.Headers['Content-Length'])" -ForegroundColor White
        
    } else {
        Write-Host "❌ Main page failed (Status: $($response.StatusCode))" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error testing deployment: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This might be due to:" -ForegroundColor Yellow
    Write-Host "   - Network connectivity issues" -ForegroundColor White
    Write-Host "   - Vercel deployment still building" -ForegroundColor White
    Write-Host "   - Authentication issues" -ForegroundColor White
}

Write-Host ""
Write-Host "🔍 Manual Testing:" -ForegroundColor Cyan
Write-Host "   1. Open your browser and go to: $deploymentUrl" -ForegroundColor White
Write-Host "   2. Check if the F1 Predict App loads correctly" -ForegroundColor White
Write-Host "   3. Test navigation between pages" -ForegroundColor White
Write-Host "   4. Check browser console for any errors" -ForegroundColor White

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Green
Write-Host "   1. Set environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "   2. Redeploy with: vercel --prod" -ForegroundColor White
Write-Host "   3. Test all functionality" -ForegroundColor White