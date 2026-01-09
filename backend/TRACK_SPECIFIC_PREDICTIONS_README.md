# Track-Specific F1 Prediction System

## 🏁 Overview

The Track-Specific F1 Prediction System is a comprehensive prediction engine that generates race predictions for each Grand Prix considering all factors including:

- **Track Characteristics**: Circuit type, length, corners, overtaking opportunities
- **Weather Conditions**: Temperature, humidity, wind, and weather impact
- **Tire Strategy**: Degradation, compounds, pit stop strategies
- **Driver Weights**: Individual driver performance multipliers
- **Team Weights**: Constructor performance factors
- **McLaren Dominance**: Enhanced performance for McLaren drivers
- **Technical Factors**: Downforce, power sensitivity, brake wear, fuel efficiency

## 🚀 Features

### Comprehensive Factor Analysis
- **Track Performance Multipliers**: Adjusts predictions based on track type (street, high-speed, technical, permanent)
- **Weather Impact**: Considers temperature, humidity, wind, and weather conditions
- **Tire Degradation**: Factors in track-specific tire wear and driver tire management skills
- **Technical Advantages**: Downforce, power sensitivity, brake wear, and fuel efficiency impacts
- **Driver-Specific Adjustments**: Individual driver weights and team performance factors

### McLaren Dominance Integration
- **Enhanced Driver Weights**: Lando Norris (1.35x) and Oscar Piastri (1.40x) performance multipliers
- **Team Performance Boost**: McLaren-Mercedes team weight of 1.35x
- **Track-Specific Advantages**: McLaren drivers excel on technical and high-speed circuits

### All 20 Drivers Coverage
- Complete predictions for all drivers in the 2025 F1 season
- Individual performance metrics and confidence scores
- Uncertainty quantification and surprise potential analysis

## 📁 File Structure

```
backend/
├── services/
│   └── TrackSpecificPredictionService.py    # Main prediction service
├── generate_track_specific_predictions.py   # Generation script
├── test_track_specific_predictions.py       # Test suite
├── driver_weights.json                      # Driver-specific weights
├── team_weights.json                        # Team performance weights
├── track_features_database.json             # Track characteristics
├── f1_calendar_2025.json                   # 2025 season calendar
└── data/
    └── enhanced_drivers_2025.py            # Driver profiles
```

## 🔧 Installation & Setup

### Prerequisites
- Python 3.8+
- Required packages: `numpy`, `pandas`, `asyncio`

### Setup Steps
1. Ensure all required JSON files are in the backend directory
2. Verify the enhanced drivers data is available
3. Run the test suite to verify functionality

## 📊 API Endpoints

### 1. Track-Specific Race Predictions
```
GET /predict/track-specific/{race_identifier}
```

**Parameters:**
- `race_identifier`: Race name, circuit, or round number
- `weather`: Weather condition (dry, wet, intermediate, mixed)
- `temperature`: Temperature in Celsius (default: 25.0)
- `humidity`: Humidity percentage (default: 60.0)
- `wind_speed`: Wind speed in km/h (default: 5.0)

**Example:**
```bash
curl "http://localhost:8000/predict/track-specific/Bahrain%20Grand%20Prix?weather=dry&temperature=30&humidity=70&wind_speed=8"
```

### 2. All Grand Prix Predictions
```
GET /predict/track-specific/all
```

**Parameters:**
- `weather`: Weather condition for all races (default: dry)

**Example:**
```bash
curl "http://localhost:8000/predict/track-specific/all?weather=dry"
```

### 3. Next Race Predictions
```
GET /predict/track-specific/next-race
```

**Parameters:**
- `weather`: Weather condition (default: dry)
- `temperature`: Temperature in Celsius (default: 25.0)
- `humidity`: Humidity percentage (default: 60.0)
- `wind_speed`: Wind speed in km/h (default: 5.0)

**Example:**
```bash
curl "http://localhost:8000/predict/track-specific/next-race?weather=wet&temperature=18&humidity=85&wind_speed=15"
```

## 🎯 Usage Examples

### Generate Predictions for All Grand Prix
```python
from services.TrackSpecificPredictionService import TrackSpecificPredictionService

# Initialize service
service = TrackSpecificPredictionService()

# Generate predictions for all races
all_predictions = await service.predict_all_grand_prix()

# Generate predictions with specific weather
wet_predictions = await service.predict_all_grand_prix("wet")
```

### Generate Predictions for Specific Race
```python
# Predict Bahrain Grand Prix
bahrain_prediction = await service.predict_grand_prix("Bahrain Grand Prix")

# Predict with wet weather conditions
monaco_wet = await service.predict_grand_prix(
    "Monaco Grand Prix", 
    weather="wet", 
    temperature=18, 
    humidity=85, 
    wind_speed=15
)
```

### Access Prediction Data
```python
# Get race information
print(f"Race: {prediction.race_name}")
print(f"Circuit: {prediction.circuit}")
print(f"Track Type: {prediction.track_type}")
print(f"Expected Pace: {prediction.expected_race_pace}")

# Get driver predictions
for driver_pred in prediction.driver_predictions:
    print(f"{driver_pred.driver_name}: {driver_pred.win_probability:.1%} win probability")
    print(f"  Track advantage: {driver_pred.track_performance_multiplier:.3f}")
    print(f"  Weather adjustment: {driver_pred.weather_adjustment:.3f}")
    print(f"  Tire factor: {driver_pred.tire_degradation_factor:.3f}")
```

## 🏆 Prediction Factors Explained

### Track Performance Multiplier
- **Street Circuits**: Favor precision and qualifying strength
- **High-Speed Tracks**: Favor power and race pace
- **Technical Tracks**: Favor tire management and skill
- **Permanent Tracks**: Balanced performance

### Weather Impact
- **Temperature**: Cold (<15°C) and hot (>35°C) conditions reduce performance
- **Humidity**: High humidity (>80%) slightly reduces performance
- **Wind**: High winds (>20 km/h) significantly impact performance
- **Wet Conditions**: Special handling with driver wet weather skills

### Tire Strategy
- **High Degradation**: Medium, Hard, Soft compounds recommended
- **Low Degradation**: Soft, Medium compounds recommended
- **Wet Weather**: Wet and Intermediate compounds
- **Pit Strategy**: Based on degradation and overtaking opportunities

### Driver Weights (2025 Season)
- **Lando Norris (McLaren)**: 1.35x - Elite performance
- **Oscar Piastri (McLaren)**: 1.40x - Elite performance
- **Max Verstappen (Red Bull)**: 1.20x - Strong performance
- **Charles Leclerc (Ferrari)**: 1.05x - Good performance
- **Lewis Hamilton (Ferrari)**: 1.00x - Baseline performance

### Team Weights
- **McLaren-Mercedes**: 1.35x - Dominant team
- **Red Bull Racing**: 1.20x - Strong team
- **Ferrari**: 1.15x - Good team
- **Mercedes**: 1.10x - Decent team

## 🧪 Testing

### Run Test Suite
```bash
cd backend
python test_track_specific_predictions.py
```

### Test Specific Components
```bash
# Test service directly
python -c "
import asyncio
from services.TrackSpecificPredictionService import TrackSpecificPredictionService
service = TrackSpecificPredictionService()
prediction = await service.predict_grand_prix('Monaco Grand Prix')
print(f'Monaco prediction: {prediction.race_name}')
"
```

### Generate Sample Predictions
```bash
# Generate predictions for all races
python generate_track_specific_predictions.py

# Generate predictions for specific race
python generate_track_specific_predictions.py "Monaco Grand Prix"

# Generate with specific weather
python generate_track_specific_predictions.py "Monaco Grand Prix" wet
```

## 📈 Expected Results

### McLaren Dominance
- **Lando Norris**: Consistently high win probabilities (15-25%)
- **Oscar Piastri**: Strong performance with high podium chances
- **Track Advantage**: McLaren drivers excel on technical and high-speed circuits

### Track-Specific Variations
- **Monaco**: High downforce tracks favor McLaren and Red Bull
- **Monza**: High-speed tracks favor power teams
- **Suzuka**: Technical tracks favor skilled drivers
- **Street Circuits**: Qualifying strength becomes crucial

### Weather Impact
- **Wet Conditions**: Drivers with strong wet weather skills gain advantage
- **High Temperatures**: Tire management becomes critical
- **Windy Conditions**: All drivers face performance reduction

## 🔍 Troubleshooting

### Common Issues
1. **Service Initialization Failed**: Check JSON file paths and data availability
2. **Predictions Not Generated**: Verify enhanced drivers data is loaded
3. **API Endpoints Not Working**: Ensure FastAPI server is running

### Debug Mode
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Initialize service with debug logging
service = TrackSpecificPredictionService()
```

### Data Validation
```python
# Check loaded data
print(f"Drivers loaded: {len(service.drivers)}")
print(f"Track features: {len(service.track_features)}")
print(f"Calendar races: {len(service.f1_calendar)}")
```

## 🚀 Performance & Scalability

### Simulation Count
- **Default**: 50,000 simulations per prediction
- **Configurable**: Adjustable in service initialization
- **Performance**: ~2-5 seconds per race prediction

### Memory Usage
- **Service**: ~50-100MB memory footprint
- **Predictions**: ~1-2MB per race prediction
- **Cache**: Predictions cached for reuse

### Optimization Tips
- Use async/await for concurrent predictions
- Cache frequently requested predictions
- Batch generate predictions for multiple races

## 🔮 Future Enhancements

### Planned Features
- **Real-time Weather Integration**: Live weather data from external APIs
- **Historical Performance**: Track-specific driver history analysis
- **Machine Learning Integration**: Enhanced prediction accuracy
- **Mobile API**: Optimized endpoints for mobile applications

### Customization Options
- **Driver Calibration**: Fine-tune individual driver performance
- **Track Modifications**: Update track characteristics dynamically
- **Weather Scenarios**: Pre-defined weather condition sets
- **Performance Metrics**: Additional statistical analysis

## 📞 Support & Contributing

### Getting Help
- Check the test suite for usage examples
- Review the API documentation
- Run diagnostics with the test script

### Contributing
- Add new track characteristics
- Enhance weather impact calculations
- Improve driver performance models
- Extend API functionality

---

**🎯 The Track-Specific F1 Prediction System provides the most comprehensive race predictions available, incorporating all factors that influence F1 race outcomes while highlighting McLaren's dominance in the 2025 season.**
