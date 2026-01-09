# F1 Hybrid Prediction System Guide

## Overview

The F1 Hybrid Prediction System is a comprehensive race prediction engine that combines:
- **ML Models**: XGBoost-based predictions
- **Calibration Factors**: Driver tiers, team weights, and performance adjustments
- **Track-Specific Adjustments**: Circuit type classifications and historical performance
- **Weather Integration**: Weather condition factors and driver sensitivity
- **Live Data**: Real-time F1 data integration (when available)

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ML Models     │    │  Calibration     │    │ Track & Weather │
│  (XGBoost)     │───▶│   Factors        │───▶│  Adjustments    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Hybrid Prediction Pipeline                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│  │ Base ML     │ │ Calibrated  │ │ Final       │             │
│  │ Predictions │ │ Predictions │ │ Predictions │             │
│  └─────────────┘ └─────────────┘ └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Driver Tiers
- **Super Elite (1.4x)**: Max Verstappen
- **Elite (1.2-1.25x)**: Lando Norris, Charles Leclerc, Lewis Hamilton
- **Strong (1.1x)**: George Russell, Oscar Piastri, Carlos Sainz
- **Midfield (0.9-1.0x)**: Fernando Alonso, Pierre Gasly, Alexander Albon
- **Developing (0.8-0.85x)**: Andrea Kimi Antonelli, Oliver Bearman

### 2. Team Performance Weights
- **Red Bull Racing**: 1.2x
- **McLaren-Mercedes**: 1.15x
- **Ferrari**: 1.1x
- **Mercedes**: 1.05x
- **Aston Martin**: 1.0x
- **Alpine**: 0.95x
- **Haas**: 0.85x

### 3. Track Classifications
- **Street**: Monaco, Baku, Singapore, Miami, Las Vegas, Jeddah
- **High-Speed**: Spa, Silverstone, Monza, Red Bull Ring
- **Technical**: Hungaroring, Suzuka, Interlagos, Budapest
- **Permanent**: Default classification

### 4. Weather Factors
- **Dry**: 1.0x (optimal)
- **Wet**: 0.9x (challenging)
- **Intermediate**: 0.95x (mixed conditions)
- **Mixed**: 0.98x (variable)

## Usage Examples

### 1. Generate Next Race Predictions

```python
from services.HybridPredictionService import HybridPredictionService
import asyncio

async def get_next_race_predictions():
    hybrid_service = HybridPredictionService()
    prediction = await hybrid_service.predict_next_race()
    
    print(f"Next Race: {prediction.race}")
    print(f"Track Type: {prediction.track_type}")
    
    for i, driver_pred in enumerate(prediction.predictions[:5], 1):
        print(f"{i}. {driver_pred.driverName} - {driver_pred.probability:.1%}")

# Run
asyncio.run(get_next_race_predictions())
```

### 2. Generate Specific Race Predictions

```python
async def get_race_predictions(race_name: str):
    hybrid_service = HybridPredictionService()
    prediction = await hybrid_service.predict_race(race_name)
    
    print(f"Race: {prediction.race}")
    print(f"Circuit: {prediction.circuit_info['circuit']}")
    print(f"Weather: {prediction.weather_conditions['condition']}")
    
    return prediction

# Example usage
monaco_pred = await get_race_predictions("Monaco Grand Prix")
```

### 3. Access Prediction Data

```python
# Get top prediction
top_driver = prediction.predictions[0]
print(f"Favored: {top_driver.driverName}")
print(f"Win Probability: {top_driver.probability:.1%}")
print(f"Confidence: {top_driver.confidence:.1%}")

# Get driver metadata
print(f"Constructor: {top_driver.constructor}")
print(f"Season Points: {top_driver.season_points}")
print(f"Track History: {top_driver.track_history}")
print(f"Weather Factor: {top_driver.weather_factor}")
```

## API Response Format

The system returns structured data in the following format:

```json
{
  "status": "success",
  "data": {
    "race": "Monaco Grand Prix",
    "round": 6,
    "season": 2025,
    "date": "2025-05-25",
    "track_type": "street",
    "weather": {
      "condition": "dry",
      "temperature": 22,
      "humidity": 65,
      "wind_speed": 8
    },
    "predictions": [
      {
        "position": 1,
        "driver_id": "VER",
        "driver_name": "Max Verstappen",
        "constructor": "Red Bull Racing",
        "win_probability": 31.73,
        "confidence": 84.0,
        "qualifying_position": 1,
        "season_points": 245.0,
        "track_history": 1.0,
        "weather_factor": 1.0
      }
    ],
    "model_version": "hybrid-v2.0",
    "generated_at": "2025-08-31T21:45:21.970697"
  }
}
```

## Available Scripts

### 1. `simple_predictions.py`
Generate predictions for multiple races with a clean output format.

```bash
python simple_predictions.py
```

### 2. `test_api_predictions.py`
Test the API endpoints and save predictions to JSON files.

```bash
python test_api_predictions.py
```

### 3. `generate_predictions.py`
Comprehensive demo with detailed output and statistics.

```bash
python generate_predictions.py
```

## Prediction Factors

### Base Probability Calculation
1. **Driver Tier Multiplier**: Base probability × driver tier factor
2. **Team Weight**: Adjusted probability × team performance factor
3. **Track Adjustment**: Circuit-specific performance multiplier
4. **Weather Factor**: Weather condition impact on driver performance
5. **Track History**: Historical performance at specific circuits
6. **Recent Form**: Current season performance and momentum

### Confidence Scoring
- **Driver Tier**: Higher tiers = higher confidence
- **Team Performance**: Stronger teams = higher confidence
- **Recent Form**: Better form = higher confidence
- **Track History**: Better history = higher confidence

## Error Handling

The system includes robust error handling:
- **API Failures**: Falls back to simulated data
- **Service Unavailable**: Uses fallback implementations
- **Data Missing**: Generates reasonable defaults
- **Network Issues**: Continues with cached/fallback data

## Performance Characteristics

- **Prediction Generation**: ~100-500ms per race
- **Memory Usage**: ~50-100MB for full system
- **Scalability**: Supports concurrent prediction requests
- **Accuracy**: Combines multiple data sources for reliability

## Integration Points

### 1. FastAPI Endpoints
```python
@app.get("/predict/next-race")
async def predict_next_race():
    return await hybrid_service.predict_next_race()

@app.get("/predict/{race_identifier}")
async def predict_specific_race(race_identifier: str):
    return await hybrid_service.predict_race(race_identifier)
```

### 2. Background Services
```python
@app.post("/train")
async def retrain_model(background_tasks: BackgroundTasks):
    background_tasks.add_task(hybrid_service.retrain)
    return {"status": "retraining started"}
```

### 3. WebSocket Updates
```python
@app.websocket("/ws/predictions")
async def websocket_endpoint(websocket: WebSocket):
    # Real-time prediction updates
    pass
```

## Troubleshooting

### Common Issues

1. **Service Initialization Failed**
   - Check service dependencies
   - Verify configuration files
   - Check network connectivity

2. **Prediction Generation Errors**
   - Verify driver data availability
   - Check track classification logic
   - Validate weather service integration

3. **Performance Issues**
   - Monitor memory usage
   - Check for memory leaks
   - Optimize prediction pipeline

### Debug Mode

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Future Enhancements

- **Real-time Data Integration**: Live F1 data feeds
- **Advanced ML Models**: Deep learning and ensemble methods
- **Historical Analysis**: Performance trend analysis
- **User Customization**: Personalized prediction preferences
- **Mobile API**: Optimized endpoints for mobile applications

## Support

For technical support or feature requests:
- Check the logs for error details
- Verify system dependencies
- Test with simplified examples
- Review the troubleshooting section

---

**Version**: hybrid-v2.0  
**Last Updated**: 2025-08-31  
**Status**: Production Ready ✅
