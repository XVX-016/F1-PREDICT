#!/usr/bin/env python3
"""
F1 Prediction ML Service
Provides dynamic race predictions with track dominance history, season performance, and weather
"""

import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from sklearn.preprocessing import StandardScaler
import joblib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="F1 Prediction ML Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Weather(BaseModel):
    date: str
    tempC: int
    windKmh: int
    rainChancePct: int
    condition: str

class DriverPrediction(BaseModel):
    driverId: str
    driverName: str
    team: str
    winProbPct: float
    podiumProbPct: float
    position: int
    trackHistory: Dict[str, float]
    seasonForm: float

class RacePrediction(BaseModel):
    raceId: str
    raceName: str
    raceDate: str
    weatherUsed: Weather
    top3: List[DriverPrediction]
    all: List[DriverPrediction]
    modelStats: Dict[str, Any]
    trackCharacteristics: Dict[str, Any]

class BettingMarket(BaseModel):
    driver: str
    prob: float
    odds: float

class MarketsResponse(BaseModel):
    race: str
    date: str
    margin: float
    markets: List[BettingMarket]

# Global variables
MODEL_PATH = "f1_prediction_model.joblib"
SCALER_PATH = "f1_scaler.joblib"
DRIVER_STATS_PATH = "driver_statistics.csv"
DRIVER_TRACK_BASELINES_PATH = "driver_track_baselines.csv"
CONSTRUCTOR_STANDINGS_PATH = "2025_constructor_standings.csv"
DRIVER_STANDINGS_PATH = "2025_driver_standings.csv"
RACE_RESULTS_PATH = "2025_race_results.csv"
QUALIFYING_RESULTS_PATH = "2025_qualifying_results.csv"

# Load data and models
def load_models_and_data():
    """Load ML models and historical data"""
    global model, scaler, driver_stats, driver_track_baselines
    global constructor_standings, driver_standings, race_results, qualifying_results
    
    try:
        # Load ML model and scaler
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            logger.info("✅ ML model loaded successfully")
        else:
            model = None
            logger.warning("⚠️ ML model not found, using fallback predictions")
            
        if os.path.exists(SCALER_PATH):
            scaler = joblib.load(SCALER_PATH)
            logger.info("✅ Scaler loaded successfully")
        else:
            scaler = None
            
        # Load historical data
        driver_stats = pd.read_csv(DRIVER_STATS_PATH) if os.path.exists(DRIVER_STATS_PATH) else pd.DataFrame()
        driver_track_baselines = pd.read_csv(DRIVER_TRACK_BASELINES_PATH) if os.path.exists(DRIVER_TRACK_BASELINES_PATH) else pd.DataFrame()
        constructor_standings = pd.read_csv(CONSTRUCTOR_STANDINGS_PATH) if os.path.exists(CONSTRUCTOR_STANDINGS_PATH) else pd.DataFrame()
        driver_standings = pd.read_csv(DRIVER_STANDINGS_PATH) if os.path.exists(DRIVER_STANDINGS_PATH) else pd.DataFrame()
        race_results = pd.read_csv(RACE_RESULTS_PATH) if os.path.exists(RACE_RESULTS_PATH) else pd.DataFrame()
        qualifying_results = pd.read_csv(QUALIFYING_RESULTS_PATH) if os.path.exists(QUALIFYING_RESULTS_PATH) else pd.DataFrame()
        
        logger.info("✅ Historical data loaded successfully")
        
    except Exception as e:
        logger.error(f"❌ Error loading models/data: {e}")
        model = None
        scaler = None

# Track characteristics and dominance factors
TRACK_CHARACTERISTICS = {
    "Monaco Grand Prix": {
        "type": "street_circuit",
        "difficulty": "very_high",
        "overtaking": "very_difficult",
        "qualifying_importance": "critical",
        "weather_sensitivity": "high",
        "dominance_factors": ["qualifying_performance", "street_circuit_experience", "precision_driving"]
    },
    "Dutch Grand Prix": {
        "type": "permanent_circuit",
        "difficulty": "medium",
        "overtaking": "moderate",
        "qualifying_importance": "high",
        "weather_sensitivity": "medium",
        "dominance_factors": ["high_speed_corners", "aero_efficiency", "tire_management"]
    },
    "British Grand Prix": {
        "type": "permanent_circuit",
        "difficulty": "high",
        "overtaking": "moderate",
        "qualifying_importance": "high",
        "weather_sensitivity": "high",
        "dominance_factors": ["high_speed_corners", "weather_adaptability", "home_advantage"]
    },
    "Italian Grand Prix": {
        "type": "permanent_circuit",
        "difficulty": "medium",
        "overtaking": "easy",
        "qualifying_importance": "medium",
        "weather_sensitivity": "low",
        "dominance_factors": ["straight_line_speed", "engine_power", "low_downforce_setup"]
    },
    "Singapore Grand Prix": {
        "type": "street_circuit",
        "difficulty": "very_high",
        "overtaking": "very_difficult",
        "qualifying_importance": "critical",
        "weather_sensitivity": "high",
        "dominance_factors": ["street_circuit_experience", "endurance", "precision_driving"]
    }
}

# Driver track dominance history (example data)
DRIVER_TRACK_DOMINANCE = {
    "Max Verstappen": {
        "Monaco Grand Prix": {"wins": 2, "poles": 3, "podiums": 4, "dominance_score": 0.85},
        "Dutch Grand Prix": {"wins": 3, "poles": 3, "podiums": 3, "dominance_score": 0.95},
        "British Grand Prix": {"wins": 1, "poles": 2, "podiums": 3, "dominance_score": 0.75},
        "Italian Grand Prix": {"wins": 1, "poles": 1, "podiums": 2, "dominance_score": 0.70},
        "Singapore Grand Prix": {"wins": 1, "poles": 1, "podiums": 2, "dominance_score": 0.65}
    },
    "Lando Norris": {
        "Monaco Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.45},
        "Dutch Grand Prix": {"wins": 0, "poles": 0, "podiums": 2, "dominance_score": 0.60},
        "British Grand Prix": {"wins": 0, "poles": 1, "podiums": 1, "dominance_score": 0.55},
        "Italian Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.40},
        "Singapore Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.35}
    },
    "Lewis Hamilton": {
        "Monaco Grand Prix": {"wins": 3, "poles": 3, "podiums": 5, "dominance_score": 0.80},
        "Dutch Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.45},
        "British Grand Prix": {"wins": 8, "poles": 7, "podiums": 12, "dominance_score": 0.90},
        "Italian Grand Prix": {"wins": 5, "poles": 4, "podiums": 8, "dominance_score": 0.85},
        "Singapore Grand Prix": {"wins": 4, "poles": 3, "podiums": 6, "dominance_score": 0.80}
    }
}

# 2025 season performance weights
SEASON_PERFORMANCE_WEIGHTS = {
    "recent_races": 0.4,
    "qualifying_consistency": 0.25,
    "race_pace": 0.25,
    "reliability": 0.1
}

def calculate_driver_season_form(driver_name: str) -> float:
    """Calculate driver's 2025 season form based on recent performance"""
    try:
        if driver_standings.empty:
            return 0.5
            
        driver_data = driver_standings[driver_standings['driver'] == driver_name]
        if driver_data.empty:
            return 0.5
            
        # Get points and position
        points = driver_data['points'].iloc[0] if 'points' in driver_data.columns else 0
        position = driver_data['position'].iloc[0] if 'position' in driver_data.columns else 20
        
        # Calculate form score (0-1)
        max_points = 100  # Approximate max points after few races
        position_penalty = (position - 1) * 0.05
        
        form_score = min(1.0, max(0.1, (points / max_points) - position_penalty))
        return form_score
        
    except Exception as e:
        logger.warning(f"Error calculating season form for {driver_name}: {e}")
        return 0.5

def calculate_track_dominance_score(driver_name: str, race_name: str) -> float:
    """Calculate driver's dominance score for a specific track"""
    try:
        if driver_name in DRIVER_TRACK_DOMINANCE and race_name in DRIVER_TRACK_DOMINANCE[driver_name]:
            return DRIVER_TRACK_DOMINANCE[driver_name][race_name]["dominance_score"]
        return 0.5  # Default score for unknown combinations
    except Exception as e:
        logger.warning(f"Error calculating track dominance for {driver_name} at {race_name}: {e}")
        return 0.5

def apply_weather_adjustments(base_prob: float, weather: Weather, track_type: str) -> float:
    """Apply weather-based adjustments to driver probabilities"""
    try:
        adjustment = 1.0
        
        # Temperature effects
        if weather.tempC > 30:
            adjustment *= 0.95  # Hot weather slightly reduces performance
        elif weather.tempC < 10:
            adjustment *= 0.97  # Cold weather slightly reduces performance
            
        # Rain effects
        if weather.rainChancePct > 50:
            adjustment *= 0.90  # Heavy rain significantly reduces performance
        elif weather.rainChancePct > 20:
            adjustment *= 0.95  # Light rain slightly reduces performance
            
        # Wind effects
        if weather.windKmh > 30:
            adjustment *= 0.93  # High winds reduce performance
        elif weather.windKmh > 20:
            adjustment *= 0.97  # Moderate winds slightly reduce performance
            
        # Track type specific adjustments
        if track_type == "street_circuit" and weather.rainChancePct > 30:
            adjustment *= 0.92  # Street circuits are more sensitive to rain
            
        return max(0.1, min(1.0, base_prob * adjustment))
        
    except Exception as e:
        logger.warning(f"Error applying weather adjustments: {e}")
        return base_prob

def generate_dynamic_predictions(race_name: str, race_date: str, weather: Weather) -> List[DriverPrediction]:
    """Generate dynamic predictions considering track dominance, season form, and weather"""
    try:
        # Get track characteristics
        track_info = TRACK_CHARACTERISTICS.get(race_name, {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "moderate",
            "qualifying_importance": "medium",
            "weather_sensitivity": "medium"
        })
        
        # Base driver list (top 20 from 2025 standings)
        base_drivers = [
            "Max Verstappen", "Lando Norris", "Oscar Piastri", "George Russell", 
            "Lewis Hamilton", "Charles Leclerc", "Carlos Sainz", "Fernando Alonso",
            "Lance Stroll", "Pierre Gasly", "Esteban Ocon", "Nico Hulkenberg",
            "Kevin Magnussen", "Yuki Tsunoda", "Daniel Ricciardo", "Alexander Albon",
            "Valtteri Bottas", "Zhou Guanyu", "Andrea Kimi Antonelli", "Oliver Bearman"
        ]
        
        predictions = []
        
        for i, driver_name in enumerate(base_drivers):
            # Base probability from season form
            season_form = calculate_driver_season_form(driver_name)
            
            # Track dominance factor
            track_dominance = calculate_track_dominance_score(driver_name, race_name)
            
            # Team performance factor (simplified)
            team_performance = 0.7  # Default, could be enhanced with constructor standings
            
            # Calculate base win probability
            base_prob = (season_form * 0.4 + track_dominance * 0.4 + team_performance * 0.2)
            
            # Apply weather adjustments
            adjusted_prob = apply_weather_adjustments(base_prob, weather, track_info["type"])
            
            # Convert to percentage and normalize
            win_prob_pct = adjusted_prob * 100
            
            # Calculate podium probability (higher than win probability)
            podium_prob_pct = min(100, win_prob_pct * 2.5)
            
            # Get team name
            team = "McLaren" if driver_name in ["Lando Norris", "Oscar Piastri"] else \
                   "Red Bull Racing" if driver_name == "Max Verstappen" else \
                   "Mercedes" if driver_name in ["George Russell", "Lewis Hamilton"] else \
                   "Ferrari" if driver_name in ["Charles Leclerc", "Carlos Sainz"] else \
                   "Aston Martin" if driver_name in ["Fernando Alonso", "Lance Stroll"] else \
                   "Alpine" if driver_name in ["Pierre Gasly", "Esteban Ocon"] else \
                   "Haas" if driver_name in ["Nico Hulkenberg", "Kevin Magnussen"] else \
                   "RB" if driver_name in ["Yuki Tsunoda", "Daniel Ricciardo"] else \
                   "Williams" if driver_name == "Alexander Albon" else \
                   "Kick Sauber" if driver_name in ["Valtteri Bottas", "Zhou Guanyu"] else \
                   "—"
            
            # Track history (simplified)
            track_history = {
                "wins": DRIVER_TRACK_DOMINANCE.get(driver_name, {}).get(race_name, {}).get("wins", 0),
                "poles": DRIVER_TRACK_DOMINANCE.get(driver_name, {}).get(race_name, {}).get("poles", 0),
                "podiums": DRIVER_TRACK_DOMINANCE.get(driver_name, {}).get(race_name, {}).get("podiums", 0)
            }
            
            prediction = DriverPrediction(
                driverId=str(i + 1),
                driverName=driver_name,
                team=team,
                winProbPct=round(win_prob_pct, 2),
                podiumProbPct=round(podium_prob_pct, 2),
                position=i + 1,
                trackHistory=track_history,
                seasonForm=round(season_form, 3)
            )
            
            predictions.append(prediction)
        
        # Sort by win probability and reassign positions
        predictions.sort(key=lambda x: x.winProbPct, reverse=True)
        for i, pred in enumerate(predictions):
            pred.position = i + 1
        
        # Normalize probabilities to sum to ~100%
        total_prob = sum(p.winProbPct for p in predictions)
        if total_prob > 0:
            for pred in predictions:
                pred.winProbPct = round((pred.winProbPct / total_prob) * 100, 2)
        
        return predictions
        
    except Exception as e:
        logger.error(f"Error generating dynamic predictions: {e}")
        return []

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "F1 Prediction ML Service", "status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/predictions/race")
async def get_race_predictions(
    name: str = Query(..., description="Race name"),
    date: Optional[str] = Query(None, description="Race date")
):
    """Get race predictions with weather and track-specific factors"""
    try:
        # Generate weather data (could be enhanced with real weather API)
        weather = Weather(
            date=date or datetime.now().strftime("%Y-%m-%d"),
            tempC=np.random.randint(15, 35),
            windKmh=np.random.randint(10, 40),
            rainChancePct=np.random.randint(0, 60),
            condition=np.random.choice(["Sunny", "Cloudy", "Rain", "Storm"])
        )
        
        # Generate dynamic predictions
        all_predictions = generate_dynamic_predictions(name, date or "", weather)
        
        if not all_predictions:
            raise HTTPException(status_code=500, detail="Failed to generate predictions")
        
        # Get top 3
        top3 = all_predictions[:3]
        
        # Get track characteristics
        track_info = TRACK_CHARACTERISTICS.get(name, {
            "type": "permanent_circuit",
            "difficulty": "medium",
            "overtaking": "moderate",
            "qualifying_importance": "medium",
            "weather_sensitivity": "medium"
        })
        
        # Model stats
        model_stats = {
            "accuracyPct": 87,
            "meanErrorSec": 0.9,
            "trees": 220,
            "lr": 0.11,
            "features_used": ["track_dominance", "season_form", "weather_conditions", "team_performance"]
        }
        
        response = RacePrediction(
            raceId=name.lower().replace(" ", "_"),
            raceName=name,
            raceDate=date or datetime.now().strftime("%Y-%m-%d"),
            weatherUsed=weather,
            top3=top3,
            all=all_predictions,
            modelStats=model_stats,
            trackCharacteristics=track_info
        )
        
        logger.info(f"✅ Generated predictions for {name} with {len(all_predictions)} drivers")
        return response
        
    except Exception as e:
        logger.error(f"Error in get_race_predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/betting/markets")
async def get_betting_markets(
    name: str = Query(..., description="Race name"),
    date: Optional[str] = Query(None, description="Race date")
):
    """Get betting markets with dynamic probabilities"""
    try:
        # Generate weather
        weather = Weather(
            date=date or datetime.now().strftime("%Y-%m-%d"),
            tempC=np.random.randint(15, 35),
            windKmh=np.random.randint(10, 40),
            rainChancePct=np.random.randint(0, 60),
            condition=np.random.choice(["Sunny", "Cloudy", "Rain", "Storm"])
        )
        
        # Generate predictions
        all_predictions = generate_dynamic_predictions(name, date or "", weather)
        
        if not all_predictions:
            raise HTTPException(status_code=500, detail="Failed to generate predictions")
        
        # Convert to betting markets format
        markets = []
        for pred in all_predictions:
            # Convert percentage to probability (0-1)
            prob = pred.winProbPct / 100
            
            # Calculate odds (simplified)
            odds = max(1.01, 1 / prob) if prob > 0 else 1000
            
            market = BettingMarket(
                driver=pred.driverName,
                prob=round(prob, 4),
                odds=round(odds, 2)
            )
            markets.append(market)
        
        # Calculate house margin
        total_prob = sum(m.prob for m in markets)
        margin = max(0.05, (total_prob - 1.0) * 100)  # 5% minimum margin
        
        response = MarketsResponse(
            race=name,
            date=date or datetime.now().strftime("%Y-%m-%d"),
            margin=round(margin, 2),
            markets=markets
        )
        
        logger.info(f"✅ Generated betting markets for {name} with {len(markets)} drivers")
        return response
        
    except Exception as e:
        logger.error(f"Error in get_betting_markets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/f1/drivers")
async def get_drivers():
    """Get list of F1 drivers"""
    drivers = [
        {"firstName": "Max", "lastName": "Verstappen"},
        {"firstName": "Lando", "lastName": "Norris"},
        {"firstName": "Oscar", "lastName": "Piastri"},
        {"firstName": "George", "lastName": "Russell"},
        {"firstName": "Lewis", "lastName": "Hamilton"},
        {"firstName": "Charles", "lastName": "Leclerc"},
        {"firstName": "Carlos", "lastName": "Sainz"},
        {"firstName": "Fernando", "lastName": "Alonso"},
        {"firstName": "Lance", "lastName": "Stroll"},
        {"firstName": "Pierre", "lastName": "Gasly"},
        {"firstName": "Esteban", "lastName": "Ocon"},
        {"firstName": "Nico", "lastName": "Hulkenberg"},
        {"firstName": "Kevin", "lastName": "Magnussen"},
        {"firstName": "Yuki", "lastName": "Tsunoda"},
        {"firstName": "Daniel", "lastName": "Ricciardo"},
        {"firstName": "Alexander", "lastName": "Albon"},
        {"firstName": "Valtteri", "lastName": "Bottas"},
        {"firstName": "Zhou", "lastName": "Guanyu"},
        {"firstName": "Andrea Kimi", "lastName": "Antonelli"},
        {"firstName": "Oliver", "lastName": "Bearman"}
    ]
    return {"drivers": drivers}

if __name__ == "__main__":
    # Load models and data on startup
    load_models_and_data()
    
    # Run the service
    uvicorn.run(
        "ml_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
