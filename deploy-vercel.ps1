# F1 Predict App - Vercel Deployment Script for Windows
# This script deploys the app to Vercel

param(
    [switch]$Redeploy,
    [switch]$Help
)

if ($Help) {
    Write-Host "F1 Predict App - Vercel Deployment Script" -ForegroundColor Green
    Write-Host "Usage: .\deploy-vercel.ps1 [-Redeploy] [-Help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Redeploy    Force redeploy even if project is linked" -ForegroundColor White
    Write-Host "  -Help        Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\deploy-vercel.ps1              # Deploy or link project" -ForegroundColor White
    Write-Host "  .\deploy-vercel.ps1 -Redeploy    # Force redeploy" -ForegroundColor White
    exit 0
}

Write-Host "🏁 F1 Predict App - Vercel Deployment" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI is not installed." -ForegroundColor Red
    Write-Host "   Install it with: npm i -g vercel" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "project\package.json")) {
    Write-Host "❌ Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

# Navigate to project directory
Write-Host "📁 Navigating to project directory..." -ForegroundColor Blue
Set-Location project

# Check if .vercel directory exists (already linked)
if ((Test-Path ".vercel") -and -not $Redeploy) {
    Write-Host "✅ Project is already linked to Vercel." -ForegroundColor Green
    $continue = Read-Host "Do you want to redeploy? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Blue

if ($Redeploy -or (Test-Path ".vercel")) {
    Write-Host "🔄 Redeploying to Vercel..." -ForegroundColor Blue
    vercel --prod
} else {
    Write-Host "🆕 Deploying to Vercel for the first time..." -ForegroundColor Blue
    Write-Host "⚠️  You'll be prompted to configure the project." -ForegroundColor Yellow
    Write-Host "📋 Recommended settings:" -ForegroundColor Cyan
    Write-Host "   - Project name: f1-predict-app" -ForegroundColor White
    Write-Host "   - Framework: Vite" -ForegroundColor White
    Write-Host "   - Build command: npm run build" -ForegroundColor White
    Write-Host "   - Output directory: dist" -ForegroundColor White
    Write-Host ""
    
    vercel
}

# Check deployment status
Write-Host "🔍 Checking deployment status..." -ForegroundColor Blue

try {
    $deployments = vercel ls
    if ($deployments -match "f1-predict-app") {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        
        # Extract deployment URL (simplified)
        $deploymentUrl = "f1-predict-app.vercel.app"
        Write-Host "🌐 Your app is live at: https://$deploymentUrl" -ForegroundColor Green
        
        # Test health endpoint
        Write-Host "🏥 Testing health endpoint..." -ForegroundColor Blue
        try {
            $response = Invoke-WebRequest -Uri "https://$deploymentUrl/api/health" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Health check passed!" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Health check failed with status: $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️  Health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "   Check the logs: vercel logs" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Useful commands:" -ForegroundColor Cyan
        Write-Host "  View logs: vercel logs" -ForegroundColor White
        Write-Host "  Redeploy:  vercel --prod" -ForegroundColor White
        Write-Host "  Local dev: vercel dev" -ForegroundColor White
        Write-Host "  Domains:   vercel domains" -ForegroundColor White
        
    } else {
        Write-Host "❌ Deployment failed. Check the logs: vercel logs" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error checking deployment status: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Check the logs: vercel logs" -ForegroundColor Yellow
    exit 1
}
