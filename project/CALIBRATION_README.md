# F1 Prediction Calibration System

A comprehensive calibration system for F1 race predictions that uses **Optuna hyperparameter optimization** to automatically tune team and driver-specific calibration factors.

## 🎯 Problem Solved

Your F1 prediction model was producing unrealistic results:
- **McLaren bias**: Both Norris and Piastri consistently on podium
- **Red Bull penalty too strong**: Max Verstappen getting squeezed out
- **Team-level calibration only**: No driver-specific adjustments

This system fixes these issues with:
1. **Driver-specific calibration** → Different multipliers per driver
2. **Podium probability capping** → Prevents unrealistic team dominance
3. **Automatic tuning** → Optuna finds optimal parameters from historical data

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r calibration_requirements.txt
```

### 2. Test the System

```bash
python test_calibration.py
```

### 3. Run Calibration Tuning

```bash
python tune_calibration.py
```

## 📁 File Structure

```
project/
├── calibration_service.py      # Core calibration functions
├── tune_calibration.py         # Optuna optimization script
├── test_calibration.py         # Test and demo script
├── calibration_requirements.txt # Python dependencies
├── calibration_config.json     # Generated optimal parameters
└── CALIBRATION_README.md       # This file
```

## 🔧 How It Works

### Calibration Pipeline

```python
from calibration_service import calibration_pipeline

# Your raw predictions
predictions = [
    {"driver": "Max Verstappen", "team": "Red Bull", "win_probability": 0.35},
    {"driver": "Lando Norris", "team": "McLaren", "win_probability": 0.25},
    # ... more drivers
]

# Apply calibration (loads from calibration_config.json automatically)
calibrated = calibration_pipeline(predictions, config_path="calibration_config.json")
```

### Calibration Steps

1. **Team Calibration**: Apply team-level multipliers
2. **Driver Calibration**: Apply driver-specific multipliers  
3. **Probability Normalization**: Ensure probabilities sum to 1.0
4. **Podium Capping**: Limit unrealistic team dominance

### Example Output

```
Original predictions:
  Max Verstappen (Red Bull): 0.350
  Lando Norris (McLaren): 0.250
  Charles Leclerc (Ferrari): 0.200

Calibrated predictions:
  Max Verstappen (Red Bull): 0.320  # Slight penalty
  Lando Norris (McLaren): 0.310     # Boost for Norris
  Charles Leclerc (Ferrari): 0.220  # Small boost
```

## 🎛️ Configuration

### Manual Configuration

```python
team_factors = {
    "Red Bull": 0.95,    # Slight penalty
    "McLaren": 1.10,     # Boost
    "Ferrari": 1.05      # Small boost
}

driver_factors = {
    "Max Verstappen": 1.05,  # Keep strong
    "Lando Norris": 1.15,    # Big boost
    "Oscar Piastri": 1.02,   # Small boost
    "Charles Leclerc": 1.08, # Boost
    "Carlos Sainz": 0.97     # Slight penalty
}

calibrated = calibration_pipeline(
    predictions,
    team_factors=team_factors,
    driver_factors=driver_factors
)
```

### Automatic Configuration (Recommended)

1. **Prepare Historical Data**: Replace sample data in `tune_calibration.py` with your actual race predictions vs actual results
2. **Run Optimization**: `python tune_calibration.py`
3. **Use Generated Config**: The system automatically loads `calibration_config.json`

## 📊 Optuna Tuning

The system uses **Optuna** to automatically find optimal calibration parameters:

### Search Space
- **Team factors**: 0.85 → 1.15 (15% penalty to 15% boost)
- **Driver factors**: 0.85 → 1.15 (15% penalty to 15% boost)

### Optimization Metric
- **Log Loss**: Minimizes prediction error on actual race winners
- **Cross-validation**: Uses multiple historical races

### Example Tuning Output

```
Starting calibration tuning with 200 trials...
Optimization completed!
Best log loss: 0.8234
Best parameters found in 156 trials

=== Best Team Factors ===
Red Bull: 0.945
McLaren: 1.087
Ferrari: 1.023
Mercedes: 0.978

=== Best Driver Factors ===
Max Verstappen: 1.034
Lando Norris: 1.142
Oscar Piastri: 1.008
Charles Leclerc: 1.067
Carlos Sainz: 0.983
```

## 🔄 Integration with Your System

### 1. In Your Prediction Service

```python
from calibration_service import calibration_pipeline

def get_race_predictions(race_data):
    # Your existing prediction logic
    raw_predictions = your_ml_model.predict(race_data)
    
    # Apply calibration
    calibrated_predictions = calibration_pipeline(
        raw_predictions,
        config_path="calibration_config.json"
    )
    
    return calibrated_predictions
```

### 2. Periodic Retuning

```python
# Run monthly or after significant rule changes
python tune_calibration.py
```

## 🎯 Expected Improvements

With proper calibration, you should see:

- **More realistic podiums**: Mixed teams instead of McLaren dominance
- **Better Max performance**: Red Bull penalty reduced but not eliminated
- **Driver differentiation**: Norris > Piastri, Leclerc > Sainz respected
- **Dynamic results**: Different tracks produce different optimal calibrations

## 🧪 Testing

### Run All Tests

```bash
python test_calibration.py
```

### Test Specific Features

```python
# Test basic calibration
calibrated = test_basic_calibration()

# Test config save/load
test_config_save_load()

# Test podium capping
test_podium_capping()
```

## 📈 Monitoring

### Key Metrics to Watch

1. **Log Loss**: Should decrease after calibration
2. **Podium Diversity**: More teams represented in top 3
3. **Driver Rankings**: Within-team order should be realistic
4. **Probability Spread**: Less extreme values (0.01-0.99 range)

### Example Monitoring Code

```python
def evaluate_calibration_quality(predictions, actual_results):
    """Monitor calibration quality over time."""
    log_loss = calculate_log_loss(predictions, actual_results)
    podium_diversity = count_unique_teams_in_podium(predictions)
    
    print(f"Log Loss: {log_loss:.4f}")
    print(f"Podium Teams: {podium_diversity}")
```

## 🚨 Troubleshooting

### Common Issues

1. **"Config file not found"**: Run `tune_calibration.py` first
2. **"No improvement in log loss"**: Check historical data quality
3. **"Unrealistic results persist"**: Adjust search space ranges
4. **"Slow optimization"**: Reduce number of trials or use faster sampler

### Debug Mode

```python
# Enable verbose logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Test with small dataset
study, config = tune_calibration(n_trials=10)
```

## 🔮 Future Enhancements

- **Track-specific calibration**: Different factors per circuit
- **Time-based decay**: Recent races weighted more heavily
- **Ensemble calibration**: Multiple calibration methods
- **Real-time adaptation**: Online learning from new results

---

## ✅ Summary

This calibration system will:

1. **Fix your McLaren bias** with driver-specific adjustments
2. **Improve Red Bull predictions** with balanced penalties
3. **Add realism** with podium probability capping
4. **Automate tuning** with Optuna optimization
5. **Integrate seamlessly** with your existing prediction pipeline

Start with `python test_calibration.py` to see it in action! 🏎️
