q@echo off
echo ========================================
echo    F1 Predict Firebase Setup Script
echo ========================================
echo.

echo This script will help you set up Firebase for your F1 Predict application.
echo.

REM Check if .env file exists
if exist .env (
    echo Found existing .env file
    echo.
    echo Current Firebase configuration:
    findstr "VITE_FIREBASE" .env
    echo.
    set /p choice="Do you want to overwrite it? (y/N): "
    if /i "%choice%"=="y" (
        echo Overwriting .env file...
    ) else (
        echo Keeping existing .env file
        goto :test
    )
) else (
    echo No .env file found. Creating one...
)

echo.
echo Please provide your Firebase configuration details:
echo.

set /p api_key="Firebase API Key: "
set /p auth_domain="Firebase Auth Domain: "
set /p project_id="Firebase Project ID: "
set /p storage_bucket="Firebase Storage Bucket: "
set /p messaging_sender_id="Firebase Messaging Sender ID: "
set /p app_id="Firebase App ID: "
set /p measurement_id="Firebase Measurement ID (optional): "

echo.
echo Creating .env file...

(
echo # Firebase Configuration
echo VITE_FIREBASE_API_KEY=%api_key%
echo VITE_FIREBASE_AUTH_DOMAIN=%auth_domain%
echo VITE_FIREBASE_PROJECT_ID=%project_id%
echo VITE_FIREBASE_STORAGE_BUCKET=%storage_bucket%
echo VITE_FIREBASE_MESSAGING_SENDER_ID=%messaging_sender_id%
echo VITE_FIREBASE_APP_ID=%app_id%
echo VITE_FIREBASE_MEASUREMENT_ID=%measurement_id%
echo.
echo # API Configuration
echo VITE_API_BASE_URL=http://localhost:8000
echo VITE_BACKEND_URL=http://localhost:3001
echo.
echo # Jolpica API ^(fallback^)
echo VITE_JOLPICA_BASE_URL=https://api.jolpi.ca/ergast/f1
echo.
echo # ML Model Configuration
echo VITE_ML_MODEL_ENABLED=true
echo VITE_ML_MODEL_UPDATE_INTERVAL=300000
echo.
echo # WebSocket Configuration
echo VITE_WEBSOCKET_URL=ws://localhost:8000/ws/live
echo VITE_WEBSOCKET_RECONNECT_ATTEMPTS=5
echo VITE_WEBSOCKET_RECONNECT_INTERVAL=1000
) > .env

echo ✅ .env file created successfully!
echo.

:test
echo Testing Firebase configuration...
npm run test-firebase

if %errorlevel% equ 0 (
    echo.
    echo 🎉 Firebase setup completed successfully!
    echo.
    echo Next steps:
    echo 1. Run: npm run seed-firebase
    echo 2. Run: npm run train-ml
    echo 3. Start your app: npm run dev
    echo.
) else (
    echo.
    echo ❌ Firebase setup failed. Please check your configuration.
    echo.
    echo Troubleshooting:
    echo 1. Verify your Firebase project is created
    echo 2. Check that Firestore is enabled
    echo 3. Ensure all environment variables are correct
    echo.
)

pause
