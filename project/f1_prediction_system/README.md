# 🏎️ F1 2025 Prediction System

A comprehensive machine learning system for predicting Formula 1 race outcomes using live data, recency-weighted features, and Monte Carlo simulation.

## 🚀 Features

- **Live Data Fetching**: Automatically pulls 2025 F1 race results, qualifying, and standings from Ergast API
- **Recency-Weighted Training**: Recent races have higher influence on predictions (EWMA-based)
- **Track-Specific Performance**: Considers each driver's historical performance at specific circuits
- **Advanced ML Models**: Uses ensemble methods (GradientBoosting + RandomForest + LogisticRegression)
- **Monte Carlo Simulation**: Runs thousands of race simulations for accurate probability estimates
- **Weather Integration**: Factors in temperature, rain, and wind effects on performance
- **Betting Odds**: Generates professional betting odds with house margin

## 📋 Prerequisites

- Python 3.8+
- pip package manager
- Internet connection for API calls

## 🛠️ Installation

1. **Navigate to the F1 prediction system directory:**
   ```bash
   cd project/f1_prediction_system
   ```

2. **Install required dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify installation:**
   ```bash
   python -c "import pandas, numpy, sklearn, joblib; print('✅ All dependencies installed successfully!')"
   ```

## 🔄 Usage Workflow

### Step 1: Fetch Live F1 Data
```bash
python fetch_2025_f1_data.py
```
This script will:
- Fetch all 2025 race results from Ergast API
- Download qualifying results and standings
- Save data to CSV files for processing

**Output files:**
- `2025_race_results.csv`
- `2025_qualifying_results.csv`
- `2025_driver_standings.csv`
- `2025_constructor_standings.csv`

### Step 2: Prepare Training Data
```bash
python prepare_training_data.py
```
This script will:
- Calculate recency-weighted features using EWMA
- Compute track-specific performance metrics
- Generate driver statistics and consistency measures
- Create the final training dataset

**Output files:**
- `training_data_weighted.csv` (main training data)
- `driver_track_baselines.csv` (track-specific performance)
- `driver_statistics.csv` (driver-level statistics)
- `feature_summary.csv` (data quality report)

### Step 3: Train the Prediction Model
```bash
python train_model.py
```
This script will:
- Train an ensemble model using multiple algorithms
- Perform cross-validation and model evaluation
- Save the trained model and feature scaler
- Generate feature importance analysis

**Output files:**
- `f1_prediction_model.joblib` (trained model)
- `f1_scaler.joblib` (feature scaler)
- `feature_importance.csv` (feature rankings)
- `feature_columns.csv` (feature mapping)
- `test_predictions.csv` (model validation results)

### Step 4: Run Monte Carlo Simulations
```bash
python monte_carlo_simulator.py
```
This script will:
- Load the trained model and data
- Run Monte Carlo simulations for race predictions
- Generate win probabilities and expected positions
- Create betting odds tables

**Output files:**
- `monte_carlo_results.csv` (simulation results)
- `betting_odds.csv` (betting odds table)

## 🎯 Customizing Predictions

### Using Your Own Grid
```python
from monte_carlo_simulator import F1MonteCarloSimulator

# Initialize simulator
simulator = F1MonteCarloSimulator()

# Create your grid (from qualifying results)
grid_df = pd.DataFrame({
    'driver': ['Lando Norris', 'Oscar Piastri', 'Max Verstappen'],
    'grid': [1, 2, 3],
    'constructor': ['McLaren', 'McLaren', 'Red Bull']
})

# Set weather conditions
weather_info = {
    'temp': 25,      # 25°C
    'rain': 0.1,     # 10% rain chance
    'wind': 20       # 20 km/h wind
}

# Run simulation
results_df, features_df = simulator.run_monte_carlo(
    grid_df, 
    "Monaco Grand Prix", 
    weather_info, 
    n_trials=5000
)

# Generate betting odds
odds_table = simulator.generate_odds_table(results_df, house_margin=0.05)
print(odds_table)
```

### Updating Data Weekly
To keep predictions current, run the data fetching script weekly:
```bash
# Every Monday after race weekend
python fetch_2025_f1_data.py
python prepare_training_data.py
python train_model.py
```

## 📊 Understanding the Output

### Model Performance Metrics
- **Accuracy**: Overall prediction accuracy
- **Precision**: How many predicted winners actually won
- **Recall**: How many actual winners were predicted
- **F1-Score**: Balanced measure of precision and recall
- **ROC AUC**: Model's ability to distinguish between classes

### Feature Importance
The system ranks features by their importance in making predictions:
- **EWMA Features**: Recent form indicators
- **Track Performance**: Historical performance at specific circuits
- **Driver Statistics**: Consistency and reliability measures
- **Qualifying Performance**: Grid position vs qualifying position

### Monte Carlo Results
- **Win Probability**: Chance of winning the race
- **Podium Probability**: Chance of finishing in top 3
- **Expected Position**: Average finishing position across simulations
- **Position Distribution**: Probability of finishing in each position

## 🔧 Configuration Options

### Adjusting Recency Weight
In `prepare_training_data.py`:
```python
EWMA_ALPHA = 0.4  # Higher = more weight to recent races
```

### Changing Simulation Parameters
In `monte_carlo_simulator.py`:
```python
N_TRIALS = 5000        # Number of race simulations
RELIABILITY_BASE = 0.95 # Base reliability for all drivers
```

### Weather Impact Settings
In `monte_carlo_simulator.py`:
```python
# Rain effects
weather_multiplier = 1.08  # Rain increases lap times by 8%
lap_std = lap_std * 1.5   # Rain increases variability by 50%

# Temperature effects
if temp > 35: weather_multiplier *= 1.05  # High temp penalty
elif temp < 5: weather_multiplier *= 1.03 # Low temp penalty
```

## 🚨 Troubleshooting

### Common Issues

1. **"Module not found" errors:**
   ```bash
   pip install -r requirements.txt
   ```

2. **CSV file not found:**
   - Ensure you've run the scripts in order
   - Check file paths and working directory

3. **Model training errors:**
   - Verify training data quality in `feature_summary.csv`
   - Check for missing or invalid values

4. **API rate limiting:**
   - The scripts include delays between API calls
   - If issues persist, increase the `time.sleep()` values

### Data Quality Checks

Review `feature_summary.csv` to ensure:
- No excessive missing values
- Reasonable data ranges
- Proper data types

## 📈 Performance Optimization

### For Large Datasets
- Use `numba` for faster Monte Carlo simulations
- Implement batch processing for large numbers of trials
- Consider using GPU acceleration for model training

### For Real-time Predictions
- Cache model predictions
- Implement incremental model updates
- Use streaming data processing

## 🔮 Future Enhancements

- **Real-time Weather Integration**: Live weather data from OpenWeatherMap API
- **Advanced Reliability Models**: Historical DNF rates and mechanical failure patterns
- **Strategy Simulation**: Pit stop timing and tire degradation models
- **Team Dynamics**: Driver pairing effects and team strategy coordination
- **Historical Weather Analysis**: Weather impact on specific tracks and drivers

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the generated CSV files for data quality
3. Verify all dependencies are installed correctly
4. Ensure you're running scripts in the correct order

## 📄 License

This project is for educational and research purposes. Please respect API rate limits and terms of service.

---

**Happy Predicting! 🏁**
