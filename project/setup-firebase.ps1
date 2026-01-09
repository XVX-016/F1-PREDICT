# F1 Predict Firebase Setup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    F1 Predict Firebase Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help you set up Firebase for your F1 Predict application." -ForegroundColor White
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "Found existing .env file" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Current Firebase configuration:" -ForegroundColor White
    Get-Content ".env" | Select-String "VITE_FIREBASE"
    Write-Host ""
    
    $choice = Read-Host "Do you want to overwrite it? (y/N)"
    if ($choice -eq "y" -or $choice -eq "Y") {
        Write-Host "Overwriting .env file..." -ForegroundColor Yellow
    } else {
        Write-Host "Keeping existing .env file" -ForegroundColor Green
        goto :test
    }
} else {
    Write-Host "No .env file found. Creating one..." -ForegroundColor Green
}

Write-Host ""
Write-Host "Please provide your Firebase configuration details:" -ForegroundColor White
Write-Host ""

$api_key = Read-Host "Firebase API Key"
$auth_domain = Read-Host "Firebase Auth Domain"
$project_id = Read-Host "Firebase Project ID"
$storage_bucket = Read-Host "Firebase Storage Bucket"
$messaging_sender_id = Read-Host "Firebase Messaging Sender ID"
$app_id = Read-Host "Firebase App ID"
$measurement_id = Read-Host "Firebase Measurement ID (optional)"

Write-Host ""
Write-Host "Creating .env file..." -ForegroundColor Yellow

$envContent = @"
# Firebase Configuration
VITE_FIREBASE_API_KEY=$api_key
VITE_FIREBASE_AUTH_DOMAIN=$auth_domain
VITE_FIREBASE_PROJECT_ID=$project_id
VITE_FIREBASE_STORAGE_BUCKET=$storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=$messaging_sender_id
VITE_FIREBASE_APP_ID=$app_id
VITE_FIREBASE_MEASUREMENT_ID=$measurement_id

# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_BACKEND_URL=http://localhost:3001

# Jolpica API (fallback)
VITE_JOLPICA_BASE_URL=https://api.jolpi.ca/ergast/f1

# ML Model Configuration
VITE_ML_MODEL_ENABLED=true
VITE_ML_MODEL_UPDATE_INTERVAL=300000

# WebSocket Configuration
VITE_WEBSOCKET_URL=ws://localhost:8000/ws/live
VITE_WEBSOCKET_RECONNECT_ATTEMPTS=5
VITE_WEBSOCKET_RECONNECT_INTERVAL=1000
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""

:test
Write-Host "Testing Firebase configuration..." -ForegroundColor Yellow
npm run test-firebase

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Firebase setup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Run: npm run seed-firebase" -ForegroundColor Cyan
    Write-Host "2. Run: npm run train-ml" -ForegroundColor Cyan
    Write-Host "3. Start your app: npm run dev" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Firebase setup failed. Please check your configuration." -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor White
    Write-Host "1. Verify your Firebase project is created" -ForegroundColor Yellow
    Write-Host "2. Check that Firestore is enabled" -ForegroundColor Yellow
    Write-Host "3. Ensure all environment variables are correct" -ForegroundColor Yellow
    Write-Host ""
}

Read-Host "Press Enter to continue"
