@echo off
echo Starting F1 Prediction ML Service...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if requirements are installed
echo Installing/updating requirements...
pip install -r requirements_ml_service.txt

echo.
echo Starting ML Service on http://localhost:8000
echo Press Ctrl+C to stop the service
echo.

REM Start the ML service
python ml_service.py

pause
