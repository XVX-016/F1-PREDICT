# F1 Predict App Deployment Script for Windows
# Domain: f1predictapp.tech

param(
    [switch]$Quick,
    [switch]$Help
)

if ($Help) {
    Write-Host "F1 Predict App Deployment Script" -ForegroundColor Green
    Write-Host "Usage: .\deploy.ps1 [-Quick] [-Help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Quick    Use quick deployment (simplified process)" -ForegroundColor White
    Write-Host "  -Help     Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\deploy.ps1              # Full deployment" -ForegroundColor White
    Write-Host "  .\deploy.ps1 -Quick       # Quick deployment" -ForegroundColor White
    exit 0
}

Write-Host "🏁 F1 Predict App - Windows Deployment for f1predictapp.tech" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install Docker Desktop for Windows first" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop" -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
$dockerComposeCmd = $null
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $dockerComposeCmd = "docker-compose"
} elseif (docker compose version 2>$null) {
    $dockerComposeCmd = "docker compose"
} else {
    Write-Host "❌ Docker Compose is not available" -ForegroundColor Red
    Write-Host "   Please install Docker Compose or update Docker Desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Using Docker Compose command: $dockerComposeCmd" -ForegroundColor Green

# Check if production environment file exists
if (-not (Test-Path "production.env")) {
    Write-Host "❌ Production environment file 'production.env' not found" -ForegroundColor Red
    Write-Host "   Please create it first with your configuration" -ForegroundColor Yellow
    exit 1
}

# Check if SSL certificates exist
if (-not (Test-Path "ssl\f1predictapp.tech.crt") -or -not (Test-Path "ssl\f1predictapp.tech.key")) {
    Write-Host "⚠️  SSL certificates not found in ssl\ directory" -ForegroundColor Yellow
    Write-Host "   Please add your SSL certificates:" -ForegroundColor Yellow
    Write-Host "   - ssl\f1predictapp.tech.crt" -ForegroundColor Yellow
    Write-Host "   - ssl\f1predictapp.tech.key" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Do you want to continue without SSL? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Load environment variables
Write-Host "📋 Loading environment variables..." -ForegroundColor Cyan
Get-Content "production.env" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
& $dockerComposeCmd -f docker-compose.prod.yml down 2>$null

# Pull latest images
Write-Host "📥 Pulling latest images..." -ForegroundColor Cyan
& $dockerComposeCmd -f docker-compose.prod.yml pull

# Build images
Write-Host "🔨 Building application images..." -ForegroundColor Cyan
& $dockerComposeCmd -f docker-compose.prod.yml build --no-cache

# Start services
Write-Host "🚀 Starting production services..." -ForegroundColor Green
& $dockerComposeCmd -f docker-compose.prod.yml up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check if services are running
Write-Host "🔍 Checking service status..." -ForegroundColor Cyan
& $dockerComposeCmd -f docker-compose.prod.yml ps

# Health check
Write-Host "🏥 Performing health check..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application is healthy and running!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Your F1 Predict App is now available at:" -ForegroundColor Green
        Write-Host "   https://f1predictapp.tech" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📊 Useful commands:" -ForegroundColor Yellow
        Write-Host "   View logs: $dockerComposeCmd -f docker-compose.prod.yml logs -f" -ForegroundColor White
        Write-Host "   Stop app:  $dockerComposeCmd -f docker-compose.prod.yml down" -ForegroundColor White
        Write-Host "   Restart:   $dockerComposeCmd -f docker-compose.prod.yml restart" -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    } else {
        throw "Health check failed with status: $($response.StatusCode)"
    }
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check if all required environment variables are set" -ForegroundColor White
    Write-Host "   2. Verify SSL certificates are valid" -ForegroundColor White
    Write-Host "   3. Ensure ports 80 and 443 are not blocked" -ForegroundColor White
    Write-Host "   4. Check Docker logs for errors" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Recent logs:" -ForegroundColor Yellow
    & $dockerComposeCmd -f docker-compose.prod.yml logs --tail=20
}
