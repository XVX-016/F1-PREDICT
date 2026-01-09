# F1 Auto-Calibration System - Complete Guide

## 🎯 Overview

Your F1 prediction system is now **self-improving**! This auto-calibration system automatically:

1. **Logs every prediction** made by your ML model
2. **Tracks actual race results** when they become available
3. **Retunes calibration parameters** using Optuna optimization
4. **Updates the system** with better parameters automatically
5. **Gets smarter with each race** 🏎️📈

---

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ML Model      │    │  Calibration    │    │   Auto-Update   │
│   (Raw Predict) │───▶│   Pipeline      │───▶│   System        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Prediction     │    │  Calibrated     │    │  Optuna Tuning  │
│   Logger        │    │  Predictions    │    │   (Background)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Race Results   │    │  React Frontend │    │  Updated Config │
│   Logger        │    │   (Betting UI)  │    │   (JSON)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📁 File Structure

```
project/
├── src/
│   ├── services/
│   │   ├── MLPredictionService.py      # Main prediction service
│   │   ├── AutoCalibrator.py           # Auto-calibration logic
│   │   └── PredictionLogger.py         # Prediction/result logging
│   └── api/
│       └── main.py                     # FastAPI backend
├── simple_calibration_service.py       # Core calibration functions
├── tune_calibration.py                 # Optuna optimization
├── test_auto_calibration_pipeline.py   # Complete system test
├── calibration_config.json             # Generated optimal parameters
├── predictions_log.json                # Logged predictions
├── race_results.json                   # Logged race results
└── AUTO_CALIBRATION_README.md          # This file
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r calibration_requirements.txt
pip install fastapi uvicorn
```

### 2. Test the Complete System

```bash
python test_auto_calibration_pipeline.py
```

### 3. Start the API Server

```bash
cd src/api
python main.py
```

### 4. Make Predictions

```python
from src.services.MLPredictionService import MLPredictionService

# Initialize service
ml_service = MLPredictionService(enable_logging=True)

# Make prediction
predictions = ml_service.predict(
    race_features={"circuit": "Monaco", "weather": "dry"},
    race_name="Monaco Grand Prix 2024"
)

print(f"Winner: {predictions[0]['driver']} ({predictions[0]['win_probability']:.3f})")
```

---

## 🔄 Auto-Calibration Workflow

### Step 1: Prediction Logging
Every time you make a prediction, it's automatically logged:

```python
# This happens automatically in MLPredictionService
predictions = ml_service.predict(race_features, race_name)
# ✅ Prediction logged to predictions_log.json
```

### Step 2: Race Result Logging
After each race, log the actual results:

```python
ml_service.log_race_result(
    race_name="Monaco Grand Prix 2024",
    actual_results=["Charles Leclerc", "Max Verstappen", "Lando Norris"]
)
# ✅ Results logged to race_results.json
```

### Step 3: Automatic Calibration Update
The system automatically detects new results and updates calibration:

```python
from src.services.AutoCalibrator import AutoCalibrator

auto_calibrator = AutoCalibrator()
success = auto_calibrator.update_calibration(n_trials=100)
# ✅ Calibration updated with new data
```

### Step 4: Improved Predictions
Next predictions use the updated calibration automatically!

---

## 🌐 API Integration

### FastAPI Endpoints

#### Make Prediction
```bash
POST /predict
{
  "race_name": "Monaco Grand Prix 2024",
  "features": {
    "circuit": "Monaco",
    "weather": "dry",
    "temperature": 25
  }
}
```

#### Log Race Results
```bash
POST /results/log
{
  "race_name": "Monaco Grand Prix 2024",
  "actual_results": ["Charles Leclerc", "Max Verstappen", "Lando Norris"],
  "race_date": "2024-05-26"
}
```

#### Update Calibration
```bash
POST /calibration/update
{
  "n_trials": 100,
  "force_update": false
}
```

#### Check Status
```bash
GET /calibration/status
```

### React Frontend Integration

Your React betting UI doesn't need to change! Just call the API:

```typescript
// Get predictions
const response = await fetch('/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    race_name: "Monaco Grand Prix 2024",
    features: { circuit: "Monaco", weather: "dry" }
  })
});

const data = await response.json();
// data.predictions now contains calibrated predictions!
```

---

## 🔧 Configuration

### Calibration Parameters

The system automatically optimizes:
- **Team factors**: Red Bull, McLaren, Ferrari, etc.
- **Driver factors**: Max Verstappen, Lando Norris, etc.
- **Search range**: 0.85 to 1.15 (15% penalty to 15% boost)

### Update Triggers

Calibration updates automatically when:
- ✅ New race results are logged
- ✅ At least 3 races of training data available
- ✅ Background task completes optimization

### Manual Updates

Force calibration updates:
```python
auto_calibrator.update_calibration(n_trials=200, force_update=True)
```

---

## 📊 Monitoring & Analytics

### Calibration Status
```python
status = auto_calibrator.get_calibration_status()
print(f"Training races: {status['training_races_count']}")
print(f"Last updated: {status['last_updated']}")
print(f"Has new results: {status['has_new_results']}")
```

### Prediction History
```python
history = ml_service.get_prediction_history()
print(f"Total predictions: {len(history)}")
```

### Performance Metrics
- **Log Loss**: Measures prediction accuracy
- **Training Races**: Number of races used for calibration
- **Update Frequency**: How often calibration improves

---

## 🔄 Continuous Learning Loop

### Weekly Schedule (Recommended)

1. **Sunday Night**: Race finishes
2. **Monday Morning**: Log race results
3. **Monday Afternoon**: Calibration auto-updates
4. **Next Race**: System uses improved parameters

### Automated Workflow

```bash
# Cron job for weekly updates
0 9 * * 1 cd /path/to/project && python -c "
from src.services.AutoCalibrator import AutoCalibrator
AutoCalibrator().schedule_weekly_update()
"
```

---

## 🧪 Testing

### Complete Pipeline Test
```bash
python test_auto_calibration_pipeline.py
```

### Individual Component Tests
```python
# Test prediction logging
from src.services.PredictionLogger import PredictionLogger
logger = PredictionLogger()
logger.log_prediction("Test Race", predictions)

# Test auto-calibration
from src.services.AutoCalibrator import AutoCalibrator
auto_calibrator = AutoCalibrator()
success = auto_calibrator.update_calibration(n_trials=50)
```

### API Testing
```bash
# Start server
cd src/api && python main.py

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/example/predict
```

---

## 🚨 Troubleshooting

### Common Issues

1. **"Not enough training data"**
   - Solution: Log at least 3 race results
   - Check: `auto_calibrator.get_calibration_status()`

2. **"Calibration config not found"**
   - Solution: Run initial calibration tuning
   - Command: `python tune_calibration.py`

3. **"Import errors"**
   - Solution: Check Python path and dependencies
   - Command: `pip install -r calibration_requirements.txt`

4. **"API not responding"**
   - Solution: Check FastAPI server is running
   - Command: `cd src/api && python main.py`

### Debug Mode

Enable verbose logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Run with debug output
auto_calibrator.update_calibration(n_trials=10, force_update=True)
```

---

## 📈 Expected Improvements

### Before Auto-Calibration
- McLaren dominance in predictions
- Red Bull over-penalization
- Unrealistic team dominance

### After Auto-Calibration
- ✅ Balanced team representation
- ✅ Realistic driver probabilities
- ✅ Improved prediction accuracy
- ✅ Self-improving system

### Performance Metrics
- **Log Loss**: Decreases over time
- **Prediction Accuracy**: Improves with more data
- **Calibration Quality**: Better probability estimates

---

## 🔮 Future Enhancements

### Planned Features
- **Track-specific calibration**: Different factors per circuit
- **Weather integration**: Rain/dry condition adjustments
- **Real-time updates**: Live calibration during races
- **Advanced metrics**: Brier score, calibration plots

### Production Deployment
- **Docker containerization**: Easy deployment
- **Kubernetes orchestration**: Scalable service
- **Monitoring integration**: Prometheus/Grafana
- **CI/CD pipeline**: Automated testing and deployment

---

## 📞 Support

### Getting Help
1. Check the troubleshooting section above
2. Review the test output for errors
3. Check the calibration status endpoint
4. Verify all dependencies are installed

### System Requirements
- Python 3.8+
- Optuna 3.0+
- FastAPI (for API mode)
- 4GB+ RAM (for calibration tuning)

---

## ✅ Summary

Your F1 prediction system now features:

- ✅ **Automatic prediction logging**
- ✅ **Race result tracking**
- ✅ **Self-improving calibration**
- ✅ **FastAPI integration**
- ✅ **Continuous learning**
- ✅ **Production-ready deployment**

**The system gets smarter with every race! 🏎️✨**

---

**Ready to dominate the F1 prediction game with AI-powered, self-improving predictions! 🏁**
