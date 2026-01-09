@echo off
echo ==========================================
echo F1 PREDICTION MARKET - AUTOMATED SETUP
echo ==========================================
echo.

echo [1/6] Setting up PostgreSQL database...
echo Please ensure PostgreSQL is installed and running
echo Creating database...
createdb f1_prediction_market 2>nul
if %errorlevel% neq 0 (
    echo Database might already exist, continuing...
)

echo [2/6] Importing database schema...
psql -d f1_prediction_market -f database/schema.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to import database schema
    echo Please check if PostgreSQL is installed and running
    pause
    exit /b 1
)

echo [3/6] Setting up backend dependencies...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed
)

echo [4/6] Creating backend environment file...
if not exist .env (
    copy env.example .env
    echo Created .env file - PLEASE CONFIGURE YOUR API KEYS
) else (
    echo .env file already exists
)

cd ..

echo [5/6] Setting up frontend dependencies...
cd project
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed
)

cd ..

echo [6/6] Setup complete!
echo.
echo ==========================================
echo NEXT STEPS:
echo ==========================================
echo 1. Configure your API keys in backend/.env:
echo    - COINBASE_COMMERCE_API_KEY
echo    - COINBASE_COMMERCE_WEBHOOK_SECRET
echo    - DATABASE_URL (if different from default)
echo.
echo 2. Start the backend server:
echo    cd backend
echo    npm run dev
echo.
echo 3. Start the frontend (in a new terminal):
echo    cd project
echo    npm start
echo.
echo 4. Access the application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:3001
echo    WebSocket: ws://localhost:3002
echo.
echo ==========================================
pause
