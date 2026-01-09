@echo off
echo 🏎️ F1 2025 Prediction System Setup
echo ======================================

echo.
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully!

echo.
echo 🔄 Step 1: Fetching live F1 data...
python fetch_2025_f1_data.py

if %errorlevel% neq 0 (
    echo ❌ Failed to fetch F1 data
    pause
    exit /b 1
)

echo.
echo 🔄 Step 2: Preparing training data...
python prepare_training_data.py

if %errorlevel% neq 0 (
    echo ❌ Failed to prepare training data
    pause
    exit /b 1
)

echo.
echo 🔄 Step 3: Training prediction model...
python train_model.py

if %errorlevel% neq 0 (
    echo ❌ Failed to train model
    pause
    exit /b 1
)

echo.
echo 🔄 Step 4: Running Monte Carlo simulation...
python monte_carlo_simulator.py

if %errorlevel% neq 0 (
    echo ❌ Failed to run simulation
    pause
    exit /b 1
)

echo.
echo 🎉 All steps completed successfully!
echo.
echo 📁 Generated files:
echo   - 2025_race_results.csv
echo   - training_data_weighted.csv
echo   - f1_prediction_model.joblib
echo   - monte_carlo_results.csv
echo   - betting_odds.csv
echo.
echo 🚀 Your F1 prediction system is ready!
pause
