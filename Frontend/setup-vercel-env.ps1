# Setup Vercel Environment Variables
# This script sets up all necessary environment variables for the F1 Predict App

Write-Host "🔧 Setting up Vercel Environment Variables for F1 Predict App" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

# Environment variables to set
$envVars = @{
    "NODE_ENV" = "production"
    "VITE_APP_NAME" = "F1 Predict App"
    "VITE_APP_VERSION" = "1.0.0"
    "VITE_APP_URL" = "https://f1-predict-main.vercel.app"
    "VITE_ERGAST_API_URL" = "https://ergast.com/api/f1"
    "VITE_FASTF1_API_URL" = "https://api.fastf1.com"
    "VITE_ENABLE_PREDICTIONS" = "true"
    "VITE_ENABLE_BETTING" = "false"
    "VITE_ENABLE_CALIBRATION" = "true"
    "VITE_DEBUG" = "false"
    "VITE_VERBOSE_LOGGING" = "false"
}

Write-Host "📋 Environment variables to set:" -ForegroundColor Cyan
foreach ($key in $envVars.Keys) {
    Write-Host "  $key = $($envVars[$key])" -ForegroundColor White
}

Write-Host ""
Write-Host "⚠️  You'll need to set these manually in the Vercel dashboard:" -ForegroundColor Yellow
Write-Host "   1. Go to https://vercel.com/tanmmays-projects/f1-predict-main/settings/environment-variables" -ForegroundColor White
Write-Host "   2. Add each environment variable listed above" -ForegroundColor White
Write-Host "   3. Make sure to set them for 'Production' environment" -ForegroundColor White
Write-Host ""

# Alternative: Use Vercel CLI (commented out as it requires interactive input)
Write-Host "💡 Alternative: Use Vercel CLI to set environment variables:" -ForegroundColor Cyan
Write-Host "   vercel env add NODE_ENV production" -ForegroundColor White
Write-Host "   vercel env add VITE_APP_NAME 'F1 Predict App'" -ForegroundColor White
Write-Host "   vercel env add VITE_APP_URL 'https://f1-predict-main.vercel.app'" -ForegroundColor White
Write-Host "   # ... and so on for each variable" -ForegroundColor White

Write-Host ""
Write-Host "✅ After setting environment variables, redeploy with:" -ForegroundColor Green
Write-Host "   vercel --prod" -ForegroundColor White
