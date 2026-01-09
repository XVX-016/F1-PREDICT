# Auto-Updating F1 Predictions System

## Overview

This system provides real-time, auto-updating F1 race predictions with a homepage podium widget and comprehensive prediction analysis page.

## Features

### 🏁 Auto-Advancing Races
- **Automatic Race Status Updates**: Races automatically advance from "upcoming" → "live" → "finished" based on server time
- **Next Race Detection**: System automatically identifies and loads the next upcoming race
- **Pre-generated Predictions**: Default predictions are generated and cached for the next race

### 🎯 Homepage Podium Widget
- **Animated Podium**: Top 3 drivers with Framer Motion animations
- **Driver Win Table**: Complete list of all drivers with win probabilities
- **Countdown Timer**: Shows time until next race
- **Weather Integration**: Displays forecast weather conditions

### 🔮 Prediction Page
- **Auto-Load Next Race**: Always shows the upcoming race without manual selection
- **Weather-Based Predictions**: Uses real weather forecasts for accurate predictions
- **Custom Conditions**: Users can input custom weather conditions for scenario analysis
- **Comparison View**: Side-by-side comparison of default vs. custom predictions

### ⚡ Real-Time Updates
- **Cron Jobs**: Automatic updates every 30 minutes (2 minutes for races within 24h)
- **Caching**: 6-hour cache duration for predictions
- **Auto-Refresh**: Frontend polls for updates every 10 minutes

## Architecture

### Frontend Components
- `NextRacePodium`: Homepage widget with animated podium
- `Podium`: Reusable podium component with Framer Motion
- `DriverWinTable`: Driver win probability table
- `PredictPage`: Main prediction analysis page

### Backend Services
- **PredictionService**: Core prediction logic and caching
- **CronService**: Automated race status updates and prediction generation
- **API Endpoints**: RESTful endpoints for races, predictions, and weather

### Data Flow
1. **Cron Service** updates race statuses every 30 minutes
2. **Frontend** loads next race and predictions on mount
3. **Weather API** provides real-time forecast data
4. **ML Model** generates predictions based on race + weather data
5. **Cache System** stores predictions for 6 hours

## API Endpoints

### Races
- `GET /api/v1/races/upcoming` - Get all upcoming races with status
- `GET /api/v1/races/next` - Get the next race
- `GET /api/v1/races/predictions/:raceId` - Get predictions for a race
- `POST /api/v1/races/predict` - Generate custom predictions
- `GET /api/v1/races/weather` - Get weather forecast for a race

### Data Contracts

#### Race
```typescript
type Race = {
  id: string;
  round: number;
  name: string;
  circuit: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  timezone: string;
  has_sprint: boolean;
  status: "upcoming" | "live" | "finished";
};
```

#### Weather
```typescript
type Weather = {
  date: string;
  tempC: number;
  windKmh: number;
  rainChancePct: number;
  condition: "Sunny"|"Cloudy"|"Rain"|"Storm";
};
```

#### Prediction
```typescript
type RacePrediction = {
  raceId: string;
  generatedAt: string;
  weatherUsed: Weather;
  top3: DriverPrediction[];
  all: DriverPrediction[];
  modelStats: { accuracyPct: number; meanErrorSec: number; trees: number; lr: number };
};
```

## Setup

### Frontend Dependencies
```bash
npm install framer-motion
```

### Backend Dependencies
```bash
npm install node-cron
```

### Environment Variables
```env
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
```

## Usage

### Homepage
The homepage automatically displays the next race with:
- Animated podium showing top 3 drivers
- Driver win probability table
- Countdown to race start
- Weather conditions

### Prediction Page
Visit `/predict` to see:
- Next race automatically loaded
- AI-generated predictions with weather integration
- Custom weather condition inputs
- Side-by-side prediction comparisons

### Custom Predictions
1. Click "Customize" on the prediction page
2. Adjust temperature, wind, rain chance, and weather type
3. Click "Generate Custom Predictions"
4. Compare with default predictions

## Auto-Update Schedule

- **Race Status Updates**: Every 30 minutes
- **Prediction Generation**: Every 6 hours (or when race changes)
- **High-Frequency Updates**: Every 2 minutes for races within 24 hours
- **Frontend Polling**: Every 10 minutes

## Weather Integration

The system integrates with OpenWeatherMap API to provide:
- Real-time temperature data
- Wind speed measurements
- Rain probability forecasts
- Weather condition classification

## Caching Strategy

- **Predictions**: 6-hour TTL with automatic refresh
- **Weather Data**: Real-time API calls with fallback
- **Race Data**: Persistent storage with status updates

## Future Enhancements

- **WebSocket Integration**: Real-time push notifications
- **ML Model Integration**: Replace mock predictions with actual ML output
- **Historical Analysis**: Track prediction accuracy over time
- **User Predictions**: Allow users to submit their own predictions
- **Social Features**: Share and compare predictions with other users

## Troubleshooting

### Common Issues

1. **No Predictions Loading**
   - Check if races exist in the database
   - Verify weather API key is set
   - Check backend cron service is running

2. **Weather Not Loading**
   - Verify OpenWeatherMap API key
   - Check circuit-to-city mapping
   - Ensure API rate limits aren't exceeded

3. **Race Status Not Updating**
   - Verify cron service is running
   - Check server timezone settings
   - Review cron job schedules

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=predictions:*
```

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Implement proper error handling
4. Add tests for new features
5. Update documentation for API changes
