# 🚀 Enhanced Hybrid F1 Prediction System

## Overview

The Enhanced Hybrid F1 Prediction System is a comprehensive upgrade to your existing F1 prediction service that now includes:

- **Live F1 Calendar Integration** - Real-time race schedules from Ergast API
- **Weather Forecasting** - Circuit-specific weather predictions with F1 impact factors
- **Rich Driver Metadata** - Comprehensive driver stats, form, and track history
- **Enhanced Prediction Pipeline** - Multi-factor predictions with weather and track adjustments
- **Flexible Race Selection** - Predict any race in the calendar, not just the next one

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FastAPI       │    │  HybridPrediction│    │   External      │
│   Endpoints     │◄──►│  Service         │◄──►│   APIs          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
              ┌─────────────────────────────────────┐
              │           Core Services             │
              ├─────────────────────────────────────┤
              │ • RaceCalendarService              │
              │ • WeatherService                   │
              │ • Enhanced Driver Data             │
              │ • ML Prediction Pipeline           │
              └─────────────────────────────────────┘
```

## 🆕 New Features

### 1. Live F1 Calendar (`RaceCalendarService`)

- **Automatic Calendar Fetching** - Pulls live F1 2025 schedule from Ergast API
- **Fallback Support** - Comprehensive fallback calendar if API fails
- **Track Classification** - Automatically categorizes circuits (street, high-speed, technical, permanent)
- **Race Lookup** - Find races by name, circuit ID, or round number

```python
from services.RaceCalendarService import RaceCalendarService

calendar = RaceCalendarService(season=2025)
next_race = calendar.get_next_race()
monaco_info = calendar.get_race("Monaco Grand Prix")
```

### 2. Weather Integration (`WeatherService`)

- **Real Weather Data** - OpenWeatherMap API integration (when API key provided)
- **Simulated Forecasts** - Realistic weather generation for testing
- **F1 Impact Factors** - Weather condition multipliers for predictions
- **Circuit-Specific** - Weather data for all F1 circuit locations

```python
from services.WeatherService import WeatherService

weather = WeatherService()
forecast = weather.get_forecast("Monaco Grand Prix")
# Returns: condition, temperature, humidity, wind_speed, precipitation_chance
```

### 3. Enhanced Driver Data (`enhanced_drivers.py`)

- **Rich Metadata** - Career stats, experience, team info
- **Season Standings** - Current 2025 championship points
- **Recent Form** - Performance momentum factors
- **Track History** - Circuit-specific performance multipliers
- **Weather Sensitivity** - How drivers perform in different conditions

```python
from data.enhanced_drivers import get_driver_info, get_driver_rankings

verstappen = get_driver_info("VER")
rankings = get_driver_rankings()
```

### 4. Enhanced Prediction Pipeline

- **Multi-Factor Analysis** - ML + Calibration + Track + Weather + Form
- **Weather Adjustments** - Driver-specific weather sensitivity
- **Track History** - Circuit performance history
- **Recent Form** - Current momentum and performance trends

## 🚀 API Endpoints

### Core Prediction Endpoints

#### `GET /predict/next-race`
Get enhanced predictions for the upcoming race.

**Response:**
```json
{
  "race": "Dutch Grand Prix",
  "round": 12,
  "season": 2025,
  "date": "2025-08-31",
  "track_type": "permanent",
  "weather_conditions": {
    "condition": "light_rain",
    "temperature": 18,
    "humidity": 75,
    "wind_speed": 8,
    "precipitation_chance": 60
  },
  "predictions": [
    {
      "driverId": "VER",
      "driverName": "Max Verstappen",
      "constructor": "Red Bull Racing",
      "probability": 0.3251,
      "confidence": 0.92,
      "qualifying_position": null,
      "season_points": 245.0,
      "recent_form": 1.2,
      "track_history": 1.1,
      "weather_factor": 1.1,
      "weather_sensitivity": {"wet": 1.2, "dry": 1.0, "mixed": 1.1}
    }
  ],
  "generated_at": "2025-08-30T10:30:00",
  "model_version": "hybrid-v2.0",
  "circuit_info": {
    "circuit": "Circuit Zandvoort",
    "location": {"locality": "Zandvoort", "country": "Netherlands"},
    "status": "scheduled"
  }
}
```

#### `GET /predict/{race_identifier}`
Get predictions for any specific race.

**Examples:**
- `/predict/Monaco%20Grand%20Prix`
- `/predict/monaco`
- `/predict/6`

### Calendar Information Endpoints

#### `GET /calendar/season`
Get complete F1 2025 season information.

#### `GET /calendar/races`
Get all races in the season.

#### `GET /calendar/race/{race_identifier}`
Get detailed information about a specific race.

### Weather Information Endpoints

#### `GET /weather/forecast/{race_identifier}`
Get weather forecast for a specific race.

### Training Endpoints

#### `POST /train`
Trigger model retraining (includes calendar refresh).

#### `GET /train/status`
Get current training status.

## 🔧 Configuration

### Environment Variables

```bash
# Optional: OpenWeatherMap API for real weather data
OPENWEATHER_API_KEY=your_api_key_here

# Existing: Jolpica API for live F1 data
JOLPICA_API_KEY=your_jolpica_key_here
```

### Dependencies

```bash
pip install -r requirements.txt
```

**New Dependencies:**
- `requests` - For API calls
- `xgboost` - For ML predictions
- `python-multipart` - For file uploads

## 🧪 Testing

Run the comprehensive test suite:

```bash
cd backend
python test_enhanced_system.py
```

This will test:
- Service initialization
- Calendar fetching
- Weather forecasting
- Driver data loading
- Prediction generation
- API endpoint functionality

## 📊 Data Sources

### Live Data
- **Ergast API** - F1 calendar and race information
- **OpenWeatherMap** - Weather forecasts (optional)
- **Jolpica API** - Live F1 data (if configured)

### Static Data
- **Enhanced Drivers** - Rich driver metadata and statistics
- **Track Classifications** - Circuit type and characteristics
- **Weather Impact Factors** - F1-specific weather multipliers

## 🔄 Data Flow

1. **Calendar Fetch** - Get live F1 schedule
2. **Weather Check** - Fetch circuit weather forecast
3. **Driver Analysis** - Load driver metadata and form
4. **ML Prediction** - Generate base probabilities
5. **Calibration** - Apply driver tier and team weights
6. **Track Adjustment** - Circuit-specific modifications
7. **Weather Adjustment** - Weather condition factors
8. **Enrichment** - Add track history and form data
9. **Normalization** - Final probability calculations
10. **Response** - Return comprehensive prediction

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the API
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Test the System
```bash
python test_enhanced_system.py
```

### 4. Use the API
```bash
# Get next race predictions
curl http://localhost:8000/predict/next-race

# Get specific race predictions
curl http://localhost:8000/predict/Monaco%20Grand%20Prix

# Get season calendar
curl http://localhost:8000/calendar/season
```

## 🔮 Future Enhancements

- **Real-time Qualifying** - Live qualifying position updates
- **Historical Weather** - Circuit weather history analysis
- **Driver Pairing** - Team dynamics and teammate comparisons
- **Advanced ML** - More sophisticated prediction models
- **Real-time Updates** - WebSocket support for live data

## 📝 API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors** - Ensure all services are in the `services/` directory
2. **API Failures** - Check network connectivity for external APIs
3. **Weather Issues** - Verify OpenWeatherMap API key if using real weather
4. **Calendar Problems** - Fallback calendar will be used if Ergast API fails

### Debug Mode

Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🤝 Contributing

The enhanced system is modular and extensible:

1. **Add New Services** - Create new service classes in `services/`
2. **Extend Driver Data** - Add fields to `enhanced_drivers.py`
3. **New Endpoints** - Add routes in `main.py`
4. **Weather Sources** - Extend `WeatherService` with new APIs

## 📄 License

This enhanced system builds upon your existing F1 prediction infrastructure and maintains the same licensing terms.

---

**🎯 Ready to revolutionize your F1 predictions with live data, weather intelligence, and rich driver analytics!**
