@echo off
echo 🏎️ Starting F1 Betting Lifecycle Background Service...
echo.
echo This service will run every 5 minutes to:
echo • Close markets automatically at race start
echo • Settle bets after race results  
echo • Generate new markets for next GP
echo.
echo Press Ctrl+C to stop the service
echo.

cd /d "%~dp0"
python start_betting_lifecycle.py

pause
