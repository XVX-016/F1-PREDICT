
$ErrorActionPreference = "Stop"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   F1 Prediction Platform - Deployment Prep    " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Environment Check
Write-Host "`n[1/5] Checking Environment..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Write-Error "Backend .env file not found! Please create 'backend\.env' from a template."
}
Write-Host "Environment files present." -ForegroundColor Green

# 2. Backend Verification
Write-Host "`n[2/5] Verifying Backend..." -ForegroundColor Yellow
Push-Location backend

Write-Host "Freezing dependencies..."
pip freeze > requirements.txt
Write-Host "Dependencies frozen to backend/requirements.txt" -ForegroundColor Gray

# Check if pytest is installed
if (Get-Command "pytest" -ErrorAction SilentlyContinue) {
    Write-Host "Running Backend Tests..."
    pytest
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Backend tests failed!"
    }
    Write-Host "Backend tests passed." -ForegroundColor Green
} else {
    Write-Warning "pytest not found. Skipping backend tests."
}

Pop-Location

# 3. Frontend Verification
Write-Host "`n[3/5] Verifying Frontend..." -ForegroundColor Yellow
Push-Location Frontend

Write-Host "Freezing dependencies (shrinkwrap)..."
cmd /c npm shrinkwrap
Write-Host "Dependencies frozen to Frontend/npm-shrinkwrap.json" -ForegroundColor Gray

Write-Host "Running Frontend Linting..."
cmd /c npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend linting failed!"
}

Write-Host "Running Frontend Tests..."
# Running in CI mode (non-interactive) if possible, or usually just verify they pass
cmd /c npm run test -- --watchAll=false
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Frontend tests failed or no tests found."
}

Write-Host "Verifying Frontend Build..."
cmd /c npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed!"
}
Write-Host "Frontend build valid." -ForegroundColor Green

Pop-Location

# 4. Simulation Pipeline Check (Dry Run)
Write-Host "`n[4/5] Checking Data Pipeline (Setup Script)..." -ForegroundColor Yellow
Write-Host "This runs the full data pipeline (Fetch -> Feature -> Model -> Sim). It may take time."
$response = Read-Host "Do you want to run the full setup pipeline? (y/n)"
if ($response -eq 'y') {
    Push-Location backend
    python setup.py
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Data pipeline setup failed!"
    }
    Write-Host "Data pipeline verified." -ForegroundColor Green
    Pop-Location
} else {
    Write-Host "Skipping data pipeline check." -ForegroundColor Gray
}

# 5. Final Summary
Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   Deployment Preparation Complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Next Steps:"
Write-Host "1. Push changes to Git."
Write-Host "2. Deploy Backend to Render/Railway."
Write-Host "3. Deploy Frontend to Vercel."
Write-Host "4. Ensure Supabase env vars are set in production."
