#!/bin/bash

echo "🏎️  F1 2025 Prediction System Setup"
echo "======================================"

echo ""
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully!"

echo ""
echo "🔄 Step 1: Fetching live F1 data..."
python fetch_2025_f1_data.py

if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch F1 data"
    exit 1
fi

echo ""
echo "🔄 Step 2: Preparing training data..."
python prepare_training_data.py

if [ $? -ne 0 ]; then
    echo "❌ Failed to prepare training data"
    exit 1
fi

echo ""
echo "🔄 Step 3: Training prediction model..."
python train_model.py

if [ $? -ne 0 ]; then
    echo "❌ Failed to train model"
    exit 1
fi

echo ""
echo "🔄 Step 4: Running Monte Carlo simulation..."
python monte_carlo_simulator.py

if [ $? -ne 0 ]; then
    echo "❌ Failed to run simulation"
    exit 1
fi

echo ""
echo "🎉 All steps completed successfully!"
echo ""
echo "📁 Generated files:"
echo "  - 2025_race_results.csv"
echo "  - training_data_weighted.csv"
echo "  - f1_prediction_model.joblib"
echo "  - monte_carlo_results.csv"
echo "  - betting_odds.csv"
echo ""
echo "🚀 Your F1 prediction system is ready!"
