import os
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import asyncio
from typing import List, Dict, Any, Optional
# Firebase removed - using Supabase exclusively
import numpy as np
import fastf1
import pandas as pd
from datetime import datetime, timezone, timedelta
from pathlib import Path
import sqlite3
import json
from enum import Enum
from services.HybridPredictionService import HybridPredictionService
from services.RaceCalendarService import RaceCalendarService
from services.WeatherService import WeatherService
# TensorFlow removed - using simplified prediction system
import os       
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import numpy as np
import os
from datetime import datetime

# Load XGBoost model for race-aware predictions
# XGBoost removed - using simplified prediction system
import json

# Model loading removed - using simplified prediction system
race_model = None
race_encoders = None

def load_race_model():
    """Model loading removed - using simplified prediction system"""
    print("Using simplified prediction system with McLaren dominance")
    return True

# REMOVED: predict_race_winner_probabilities() - This function predicted winners directly
# This violates the new architecture where ML only predicts pace deltas, not winners

def _build_ml_features(driver_name: str, team_name: str, race_name: str, date: str | None) -> dict:
    """Build feature vector for ML model prediction"""
    # Encode categorical features
    driver_encoded = race_encoders["driver"].get(driver_name, 0)
    team_encoded = race_encoders["team"].get(team_name, 0)
    race_encoded = race_encoders["race"].get(race_name, 0)
    circuit_type = _get_circuit_type(race_name)
    circuit_type_encoded = race_encoders["circuit_type"].get(circuit_type, 0)
    
    # Season round
    season_round = _extract_season_round(date)
    
    # Performance features (simplified - in real implementation these would come from historical data)
    driver_wins = 5 if "Verstappen" in driver_name else 2 if "Norris" in driver_name else 1
    driver_podiums = 15 if "Verstappen" in driver_name else 8 if "Norris" in driver_name else 3
    driver_avg_position = 3.5 if "Verstappen" in driver_name else 5.0 if "Norris" in driver_name else 8.0
    
    team_wins = 8 if "Red Bull" in team_name else 4 if "McLaren" in team_name else 2
    team_podiums = 20 if "Red Bull" in team_name else 12 if "McLaren" in team_name else 6
    team_avg_position = 4.0 if "Red Bull" in team_name else 5.5 if "McLaren" in team_name else 7.0
    
    # Circuit-specific features
    driver_circuit_wins = 1 if "Verstappen" in driver_name else 0
    team_circuit_wins = 1 if "Red Bull" in team_name else 0
    
    return {
        "driver_encoded": driver_encoded,
        "team_encoded": team_encoded,
        "race_encoded": race_encoded,
        "circuit_type_encoded": circuit_type_encoded,
        "round": season_round,
        "driver_wins": driver_wins,
        "driver_podiums": driver_podiums,
        "driver_avg_position": driver_avg_position,
        "team_wins": team_wins,
        "team_podiums": team_podiums,
        "team_avg_position": team_avg_position,
        "driver_circuit_wins": driver_circuit_wins,
        "team_circuit_wins": team_circuit_wins
    }

# Initialize FastF1
fastf1.Cache.enable_cache('cache')  # Enable caching for better performance

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred = credentials.Certificate(os.environ.get("FIREBASE_CREDENTIALS", "serviceaccountkey.json"))
    firebase_admin.initialize_app(cred)
db = firestore.client()

# Model loading removed - using simplified prediction system

# Live data management
class RaceStatus(Enum):
    PRE_RACE = "pre_race"
    RACE = "race"
    POST_RACE = "post_race"
    QUALIFYING = "qualifying"
    PRACTICE = "practice"

class LiveDataManager:
    def __init__(self):
        self.connected_clients: List[WebSocket] = []
        self.current_race_status = RaceStatus.PRE_RACE
        self.current_session = None
        self.live_lap_data = {}
        self.live_positions = []
        self.live_odds = {}
        self.race_start_time = None
        self.last_update = datetime.utcnow()
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connected_clients.append(websocket)
        
    def disconnect(self, websocket: WebSocket):
        if websocket in self.connected_clients:
            self.connected_clients.remove(websocket)
            
    async def broadcast(self, message: dict):
        if self.connected_clients:
            await asyncio.gather(
                *[client.send_text(json.dumps(message)) for client in self.connected_clients],
                return_exceptions=True
            )

live_manager = LiveDataManager()

def load_model_if_needed():
    # Model loading removed - using simplified prediction system
    return None

def preprocess_features(drivers: List[Dict[str, Any]], req: Dict[str, Any]) -> np.ndarray:
    # TODO: Replace with real preprocessing that matches training
    num_features = 10
    return np.random.rand(len(drivers), num_features).astype(np.float32)

def postprocess_predictions(raw: np.ndarray) -> List[float]:
    # Normalize predictions into probabilities
    if raw is None:
        return []
    arr = np.array(raw)
    if arr.ndim == 2 and arr.shape[1] > 1:
        exps = np.exp(arr - np.max(arr, axis=1, keepdims=True))
        probs = exps / np.sum(exps, axis=1, keepdims=True)
        return probs[:, -1].astype(float).tolist()
    flat = arr.reshape(-1)
    flat = np.clip(flat, 0, None)
    if flat.sum() <= 0:
        return (np.ones_like(flat) / len(flat)).astype(float).tolist()
    return (flat / flat.sum()).astype(float).tolist()

# FastAPI app
app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class PredictRequest(BaseModel):
    weather: str | None = None
    track: str | None = None
    tyres: str | None = None
    drs: str | None = None
    constructors: List[str] | None = None

class LiveRaceData(BaseModel):
    session_type: str
    lap_number: int
    total_laps: int
    race_time: str
    positions: List[Dict[str, Any]]
    lap_times: List[Dict[str, Any]]
    weather: Dict[str, Any] | None = None

# Fantasy points settings
POINTS_SIGNUP_CREDIT = int(os.environ.get("POINTS_SIGNUP_CREDIT", "10000"))
POINTS_REFILL_AMOUNT = int(os.environ.get("POINTS_REFILL_AMOUNT", "1000"))
POINTS_REFILL_INTERVAL_HOURS = int(os.environ.get("POINTS_REFILL_INTERVAL_HOURS", "4"))
POINTS_MAX_CAP = int(os.environ.get("POINTS_MAX_CAP", "20000"))

# Live data helpers
def get_current_race_session(year: int = 2024) -> Optional[Dict[str, Any]]:
    """Get the current or next race session"""
    try:
        schedule = fastf1.get_event_schedule(year)
        now = datetime.now(timezone.utc)
        
        for _, event in schedule.iterrows():
            event_date = event["EventDate"].replace(tzinfo=timezone.utc)
            # Check if race is happening now or within next 2 hours
            if event_date <= now <= event_date + timedelta(hours=3):
                return {
                    "round": event["RoundNumber"],
                    "name": event["EventName"],
                    "circuit": event.get("Location", "Unknown"),
                    "date": event["EventDate"].isoformat(),
                    "status": "live"
                }
            # Check if race is starting soon
            elif event_date - timedelta(hours=2) <= now <= event_date:
                return {
                    "round": event["RoundNumber"],
                    "name": event["EventName"],
                    "circuit": event.get("Location", "Unknown"),
                    "date": event["EventDate"].isoformat(),
                    "status": "starting_soon"
                }
        return None
    except Exception as e:
        print(f"Error getting current session: {e}")
        return None

def get_weather_data(circuit: str) -> Dict[str, Any]:
    """Get weather data for a circuit (simulated for now)"""
    # In a real implementation, this would call a weather API
    # For now, we'll simulate weather data based on the circuit
    weather_conditions = {
        "Monaco": {"temperature": 22, "humidity": 70, "wind_speed": 8, "conditions": "Partly Cloudy"},
        "Silverstone": {"temperature": 18, "humidity": 65, "wind_speed": 15, "conditions": "Overcast"},
        "Spa": {"temperature": 16, "humidity": 80, "wind_speed": 12, "conditions": "Light Rain"},
        "Monza": {"temperature": 25, "humidity": 55, "wind_speed": 5, "conditions": "Sunny"},
        "Suzuka": {"temperature": 20, "humidity": 75, "wind_speed": 10, "conditions": "Cloudy"},
        "Interlagos": {"temperature": 28, "humidity": 60, "wind_speed": 8, "conditions": "Partly Cloudy"},
        "Yas Marina": {"temperature": 32, "humidity": 45, "wind_speed": 3, "conditions": "Clear"},
        "Red Bull Ring": {"temperature": 19, "humidity": 70, "wind_speed": 12, "conditions": "Partly Cloudy"},
        "Hungaroring": {"temperature": 24, "humidity": 65, "wind_speed": 6, "conditions": "Sunny"},
        "Circuit de Barcelona": {"temperature": 23, "humidity": 60, "wind_speed": 8, "conditions": "Partly Cloudy"}
    }
    
    # Find matching circuit or return default
    for circuit_name, weather in weather_conditions.items():
        if circuit_name.lower() in circuit.lower() or circuit.lower() in circuit_name.lower():
            return weather
    
    # Default weather
    return {
        "temperature": 22,
        "humidity": 65,
        "wind_speed": 8,
        "conditions": "Partly Cloudy"
    }

def get_live_race_data(year: int, round_num: int) -> Optional[LiveRaceData]:
    """Get live race data including positions and lap times"""
    try:
        session = fastf1.get_session(year, round_num, 'R')
        session.load()
        
        # Get current lap and race time
        current_lap = session.laps.iloc[-1]["LapNumber"] if len(session.laps) > 0 else 0
        total_laps = session.total_laps if hasattr(session, 'total_laps') else 50
        
        # Get current positions
        positions = []
        if hasattr(session, 'results') and session.results is not None:
            for _, row in session.results.iterrows():
                positions.append({
                    "position": row["Position"],
                    "driverId": row["DriverId"],
                    "driverName": f"{row['FirstName']} {row['LastName']}",
                    "team": row["TeamName"],
                    "lastLapTime": row.get("LastLapTime", "N/A"),
                    "status": row["Status"]
                })
        
        # Get recent lap times
        lap_times = []
        if len(session.laps) > 0:
            recent_laps = session.laps.tail(20)  # Last 20 laps
            for _, lap in recent_laps.iterrows():
                lap_times.append({
                    "lapNumber": lap["LapNumber"],
                    "driverId": lap["DriverId"],
                    "lapTime": lap["LapTime"],
                    "sector1Time": lap.get("Sector1Time", None),
                    "sector2Time": lap.get("Sector2Time", None),
                    "sector3Time": lap.get("Sector3Time", None)
                })
        
        # Get weather data for the circuit
        circuit_name = session.event.get("Location", "Unknown")
        weather = get_weather_data(circuit_name)
        
        return LiveRaceData(
            session_type="race",
            lap_number=current_lap,
            total_laps=total_laps,
            race_time=str(session.laps.iloc[-1]["Time"] if len(session.laps) > 0 else "00:00:00"),
            positions=positions,
            lap_times=lap_times,
            weather=weather
        )
    except Exception as e:
        print(f"Error getting live race data: {e}")
        return None

def calculate_live_odds(positions: List[Dict[str, Any]], lap_number: int, total_laps: int) -> Dict[str, float]:
    """Calculate live odds based on current race positions and progress"""
    if not positions:
        return {}
    
    live_odds = {}
    race_progress = lap_number / total_laps if total_laps > 0 else 0
    
    for pos in positions:
        driver_id = pos["driverId"]
        position = pos["position"]
        status = pos["status"]
        
        if status != "Finished":
            # Base probability based on current position
            base_prob = max(0.01, 1 / position)
            
            # Adjust based on race progress (later in race = more certain)
            progress_factor = 0.5 + (race_progress * 0.5)
            
            # Position-based adjustments
            if position == 1:
                position_bonus = 0.3
            elif position <= 3:
                position_bonus = 0.1
            elif position <= 10:
                position_bonus = 0.05
            else:
                position_bonus = 0
            
            final_prob = (base_prob * progress_factor) + position_bonus
            final_prob = min(final_prob, 0.95)  # Cap at 95%
            
            live_odds[driver_id] = 1 / final_prob
        else:
            # Driver has finished
            live_odds[driver_id] = 1.0 if position == 1 else 0.0
    
    return live_odds

# FastF1 data helpers
def get_f1_drivers(year: int = 2024) -> List[Dict[str, Any]]:
    """Get current F1 drivers using FastF1"""
    try:
        # Get drivers from a session
        session = fastf1.get_session(year, 1, 'R')  # Use first race
        session.load()
        drivers = []
        for driver_id, driver_info in session.drivers.items():
            drivers.append({
                "driverId": driver_id,
                "firstName": driver_info["FirstName"],
                "lastName": driver_info["LastName"],
                "team": driver_info.get("TeamName", "Unknown"),
                "number": int(driver_id) if driver_id.isdigit() else 0
            })
        return drivers
    except Exception as e:
        print(f"FastF1 drivers fetch failed: {e}")
        # Fallback to basic driver list
        return [
            {"driverId": "max_verstappen", "firstName": "Max", "lastName": "Verstappen", "team": "Red Bull Racing"},
            {"driverId": "lando_norris", "firstName": "Lando", "lastName": "Norris", "team": "McLaren"},
            {"driverId": "charles_leclerc", "firstName": "Charles", "lastName": "Leclerc", "team": "Ferrari"},
        ]

def get_f1_races(year: int = 2024) -> List[Dict[str, Any]]:
    """Get F1 race calendar using FastF1"""
    try:
        schedule = fastf1.get_event_schedule(year)
        races = []
        for _, event in schedule.iterrows():
            races.append({
                "round": event["RoundNumber"],
                "name": event["EventName"],
                "circuit": event.get("Location", "Unknown"),
                "date": event["EventDate"].isoformat(),
                "country": event.get("Country", "Unknown")
            })
        return races
    except Exception as e:
        print(f"FastF1 races fetch failed: {e}")
        return []

def get_race_results(year: int, round_num: int) -> List[Dict[str, Any]]:
    """Get race results using FastF1"""
    try:
        session = fastf1.get_session(year, round_num, 'R')
        session.load()
        results = session.results
        return [
            {
                "position": row["Position"],
                "driverId": row["DriverId"],
                "driverName": f"{row['FirstName']} {row['LastName']}",
                "team": row["TeamName"],
                "points": row["Points"],
                "status": row["Status"]
            }
            for _, row in results.iterrows()
        ]
    except Exception as e:
        print(f"FastF1 results fetch failed: {e}")
        return []

def get_driver_stats(driver_id: str, year: int = 2024) -> Dict[str, Any]:
    """Get comprehensive driver statistics using FastF1"""
    try:
        # Get all sessions for the year
        schedule = fastf1.get_event_schedule(year)
        stats = {
            "points": 0,
            "wins": 0,
            "podiums": 0,
            "dnfs": 0,
            "fastest_laps": 0,
            "poles": 0,
            "races": 0
        }
        
        for _, event in schedule.iterrows():
            try:
                # Get race results
                session = fastf1.get_session(year, event["RoundNumber"], 'R')
                session.load()
                results = session.results
                driver_result = results[results["DriverId"] == driver_id]
                
                if not driver_result.empty:
                    stats["races"] += 1
                    stats["points"] += driver_result.iloc[0]["Points"]
                    position = driver_result.iloc[0]["Position"]
                    
                    if position == 1:
                        stats["wins"] += 1
                    if position <= 3:
                        stats["podiums"] += 1
                    if driver_result.iloc[0]["Status"] != "Finished":
                        stats["dnfs"] += 1
                    # Note: Fastest lap data might need different approach
                
                # Get qualifying results
                try:
                    quali_session = fastf1.get_session(year, event["RoundNumber"], 'Q')
                    quali_session.load()
                    quali_results = quali_session.results
                    driver_quali = quali_results[quali_results["DriverId"] == driver_id]
                    
                    if not driver_quali.empty and driver_quali.iloc[0]["Position"] == 1:
                        stats["poles"] += 1
                except:
                    pass  # Qualifying data might not be available
                    
            except Exception as e:
                print(f"Error processing race {event['RoundNumber']}: {e}")
                continue
                
        return stats
    except Exception as e:
        print(f"FastF1 driver stats fetch failed: {e}")
        return {"points": 0, "wins": 0, "podiums": 0, "dnfs": 0, "fastest_laps": 0, "poles": 0, "races": 0}

# WebSocket endpoint for live updates
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await live_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and send periodic updates
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        live_manager.disconnect(websocket)

# Live data endpoints
@app.get("/live/status")
async def get_live_status():
    """Get current race status and session info"""
    current_session = get_current_race_session()
    return {
        "status": live_manager.current_race_status.value,
        "current_session": current_session,
        "last_update": live_manager.last_update.isoformat(),
        "connected_clients": len(live_manager.connected_clients)
    }

@app.get("/live/race/{year}/{round}")
async def get_live_race(year: int, round: int):
    """Get live race data including positions and lap times"""
    live_data = get_live_race_data(year, round)
    if live_data:
        # Calculate live odds
        live_odds = calculate_live_odds(live_data.positions, live_data.lap_number, live_data.total_laps)
        
        # Update live manager
        live_manager.live_positions = live_data.positions
        live_manager.live_odds = live_odds
        live_manager.last_update = datetime.utcnow()
        
        # Broadcast to connected clients
        await live_manager.broadcast({
            "type": "live_race_update",
            "data": {
                "positions": live_data.positions,
                "lap_number": live_data.lap_number,
                "total_laps": live_data.total_laps,
                "race_time": live_data.race_time,
                "live_odds": live_odds,
                "last_update": live_manager.last_update.isoformat()
            }
        })
        
        return {
            "positions": live_data.positions,
            "lap_number": live_data.lap_number,
            "total_laps": live_data.total_laps,
            "race_time": live_data.race_time,
            "lap_times": live_data.lap_times,
            "live_odds": live_odds,
            "weather": live_data.weather,
            "last_update": live_manager.last_update.isoformat()
        }
    else:
        raise HTTPException(status_code=404, detail="Live race data not available")

@app.get("/live/odds/{year}/{round}")
async def get_live_odds(year: int, round: int):
    """Get live odds based on current race progress"""
    live_data = get_live_race_data(year, round)
    if live_data:
        live_odds = calculate_live_odds(live_data.positions, live_data.lap_number, live_data.total_laps)
        return {
            "odds": live_odds,
            "lap_number": live_data.lap_number,
            "total_laps": live_data.total_laps,
            "race_progress": live_data.lap_number / live_data.total_laps if live_data.total_laps > 0 else 0,
            "last_update": datetime.utcnow().isoformat()
        }
    else:
        raise HTTPException(status_code=404, detail="Live odds not available")

# ---------- Predictions (per-race) with strict 404 when unavailable ----------
def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _processed_dir() -> Path:
    return _repo_root() / "project" / "f1_prediction_system" / "data" / "processed"


def _raw_dir() -> Path:
    return _repo_root() / "project" / "f1_prediction_system" / "data" / "raw"


def _betting_db_path() -> Path:
    db_dir = _repo_root() / "project" / "f1_prediction_system" / "data"
    db_dir.mkdir(parents=True, exist_ok=True)
    return db_dir / "betting.db"


def _db() -> sqlite3.Connection:
    conn = sqlite3.connect(_betting_db_path())
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    conn = _db()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT,
          balance INTEGER DEFAULT 0,
          created_at TEXT
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS bets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          race_name TEXT,
          race_date TEXT,
          driver TEXT,
          stake INTEGER,
          odds REAL,
          status TEXT DEFAULT 'pending',
          payout INTEGER DEFAULT 0,
          created_at TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    conn.commit()
    conn.close()


_init_db()


@app.get("/predictions/race")
def get_race_prediction(name: str, date: str | None = None, season: int = 2025):
    """Return hybrid race predictions using live F1 data + ML + calibration.
    
    This endpoint combines:
    1. Live F1 data (qualifying results, driver standings)
    2. ML model predictions (if available)
    3. Calibration adjustments (track, driver, team factors)
    """
    try:
        # Import the enhanced hybrid Monte Carlo prediction service
        from services.EnhancedHybridMonteCarloService import enhanced_hybrid_monte_carlo_service
        
        # Get comprehensive predictions using enhanced hybrid Monte Carlo service
        result = enhanced_hybrid_monte_carlo_service.get_race_predictions(name, season)
        
        return result
        
    except Exception as e:
        print(f"Race prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/predictions/next-race")
def get_next_race_prediction(season: int = 2025):
    """Get predictions for the next upcoming race"""
    try:
        from services.EnhancedHybridMonteCarloService import enhanced_hybrid_monte_carlo_service
        
        # Get predictions for the next race using enhanced hybrid Monte Carlo service
        result = enhanced_hybrid_monte_carlo_service.get_next_race_predictions(season)
        
        if not result:
            raise HTTPException(status_code=404, detail="No predictions available for next race")
        
        return result
        
    except Exception as e:
        print(f"Next race prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Next race prediction failed: {str(e)}")

# New enhanced hybrid Monte Carlo prediction endpoints
@app.get("/predict/next-race/simple")
def get_next_race_simple_predictions(season: int = 2025):
    """Get simplified predictions for the next race"""
    try:
        from services.EnhancedHybridMonteCarloService import enhanced_hybrid_monte_carlo_service
        
        result = enhanced_hybrid_monte_carlo_service.get_next_race_predictions(season)
        if not result:
            raise HTTPException(status_code=404, detail="No predictions available for next race")
        
        return result
        
    except Exception as e:
        print(f"Next race simple predictions failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get simple predictions: {str(e)}")

@app.get("/predict/{race_identifier}")
def get_race_predictions(race_identifier: str, season: int = 2025):
    """Get predictions for a specific race"""
    try:
        from services.EnhancedHybridMonteCarloService import enhanced_hybrid_monte_carlo_service
        
        result = enhanced_hybrid_monte_carlo_service.get_race_predictions(race_identifier, season)
        if not result:
            raise HTTPException(status_code=404, detail=f"No predictions available for race: {race_identifier}")
        
        return result
        
    except Exception as e:
        print(f"Race predictions failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get race predictions: {str(e)}")


# ---------- Betting: markets, place, settle, profile ----------

# API v1 endpoints for frontend compatibility
@app.get("/api/v1/markets")
def get_api_v1_markets(
    category: str = Query(None, description="Market category filter"),
    race_id: str = Query(None, description="Race ID filter"),
    status: str = Query("open", description="Market status (open/closed)")
):
    """Get betting markets in API v1 format for frontend compatibility"""
    try:
        from services.MarketService import market_service
        from services.BettingLifecycleService import betting_lifecycle_service
        
        # Get all active markets
        all_markets = market_service.get_all_active_markets()
        
        # Transform to API v1 format
        api_markets = []
        for race_id_key, race_markets in all_markets.items():
            if race_markets and 'markets' in race_markets:
                for market in race_markets['markets']:
                    # Apply filters
                    if category and market.get('market_type') != category:
                        continue
                    if race_id and race_id_key != race_id:
                        continue
                    if status == "open" and not market.get('status') == 'active':
                        continue
                    if status == "closed" and market.get('status') == 'active':
                        continue
                    
                    # Transform market to API v1 format
                    api_market = {
                        "id": market.get('market_id'),
                        "title": market.get('name'),
                        "description": market.get('description'),
                        "market_type": market.get('market_type'),
                        "race_id": race_id_key,
                        "race_name": f"{race_id_key.replace('_', ' ').title()} Grand Prix",
                        "race_date": race_markets.get('created_at'),
                        "status": "open" if market.get('status') == 'active' else "closed",
                        "closing_time": race_markets.get('created_at'),  # Would be race start time
                        "created_at": race_markets.get('created_at'),
                        "selections": []
                    }
                    
                    # Transform options to selections
                    for option in market.get('options', []):
                        selection = {
                            "id": f"{market.get('market_id')}_{option.get('driver', option.get('team', 'unknown')).lower().replace(' ', '_')}",
                            "title": option.get('driver', option.get('team', 'Unknown')),
                            "odds": option.get('odds', 1.0),
                            "is_winner": False  # Would be set after race results
                        }
                        api_market["selections"].append(selection)
                    
                    api_markets.append(api_market)
        
        return {
            "status": "success",
            "data": api_markets,
            "total": len(api_markets),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error getting API v1 markets: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get markets: {str(e)}")

@app.get("/api/v1/markets/{race_id}")
def get_api_v1_race_markets(race_id: str):
    """Get betting markets for a specific race in API v1 format"""
    try:
        from services.MarketService import market_service
        
        # Get markets for specific race
        race_markets = market_service.get_race_markets(race_id)
        
        if not race_markets:
            raise HTTPException(status_code=404, detail=f"No markets found for race: {race_id}")
        
        # Transform to API v1 format
        api_markets = []
        for market in race_markets.get('markets', []):
            api_market = {
                "id": market.get('market_id'),
                "title": market.get('name'),
                "description": market.get('description'),
                "market_type": market.get('market_type'),
                "race_id": race_id,
                "race_name": f"{race_id.replace('_', ' ').title()} Grand Prix",
                "race_date": race_markets.get('created_at'),
                "status": "open" if market.get('status') == 'active' else "closed",
                "closing_time": race_markets.get('created_at'),
                "created_at": race_markets.get('created_at'),
                "selections": []
            }
            
            # Transform options to selections
            for option in market.get('options', []):
                selection = {
                    "id": f"{market.get('market_id')}_{option.get('driver', option.get('team', 'unknown')).lower().replace(' ', '_')}",
                    "title": option.get('driver', option.get('team', 'Unknown')),
                    "odds": option.get('odds', 1.0),
                    "is_winner": False
                }
                api_market["selections"].append(selection)
            
            api_markets.append(api_market)
        
        return {
            "status": "success",
            "data": api_markets,
            "total": len(api_markets),
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting API v1 race markets: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get race markets: {str(e)}")

# Circuit type mapping for race-aware features
CIRCUIT_TYPES = {
    "Monaco": "street",
    "Singapore": "street", 
    "Baku": "street",
    "Miami": "street",
    "Las Vegas": "street",
    "Melbourne": "street",
    "Jeddah": "street",
    "Monza": "permanent",
    "Silverstone": "permanent",
    "Spa": "permanent",
    "Suzuka": "permanent",
    "Interlagos": "permanent",
    "Yas Marina": "permanent",
    "Red Bull Ring": "permanent",
    "Hungaroring": "permanent",
    "Circuit de Barcelona": "permanent",
    "Imola": "permanent",
    "Montreal": "permanent",
    "Austin": "permanent",
    "Mexico City": "permanent",
    "São Paulo": "permanent",
    "Lusail": "permanent",
    "Shanghai": "permanent",
    "Zandvoort": "permanent"
}

def _get_circuit_type(race_name: str) -> str:
    """Map race name to circuit type for feature engineering"""
    for circuit, circuit_type in CIRCUIT_TYPES.items():
        if circuit.lower() in race_name.lower():
            return circuit_type
    return "permanent"  # default

def _extract_season_round(date_str: str | None) -> int:
    """Extract season round from date (approximate)"""
    if not date_str:
        return 1
    try:
        # Parse date and estimate round based on month
        from datetime import datetime
        date = datetime.strptime(date_str, "%Y-%m-%d")
        month = date.month
        # Rough mapping: March=1, April=2-3, May=4-5, etc.
        if month <= 3: return 1
        elif month <= 4: return 2
        elif month <= 5: return 4
        elif month <= 6: return 6
        elif month <= 7: return 8
        elif month <= 8: return 10
        elif month <= 9: return 12
        elif month <= 10: return 14
        elif month <= 11: return 16
        else: return 18
    except:
        return 1

def _build_race_features(driver_name: str, team_name: str, race_name: str, date: str | None) -> dict:
    """Build race-aware feature vector for a driver"""
    circuit_type = _get_circuit_type(race_name)
    season_round = _extract_season_round(date)
    
    # Simple hash-based encoding for categorical features
    driver_hash = hash(driver_name.lower()) % 1000
    team_hash = hash(team_name.lower()) % 100
    race_hash = hash(race_name.lower()) % 500
    circuit_type_hash = hash(circuit_type) % 10
    
    return {
        "driver_id": driver_hash,
        "team_id": team_hash, 
        "race_id": race_hash,
        "circuit_type": circuit_type_hash,
        "season_round": season_round,
        "is_street_circuit": 1 if circuit_type == "street" else 0,
        "is_permanent_circuit": 1 if circuit_type == "permanent" else 0
    }

def _get_dynamic_probabilities(race_name: str, date: str | None) -> list[dict]:
    """Generate race-aware probabilities using feature engineering"""
    # Current F1 drivers (2025 season)
    drivers = [
    {"name": "Max Verstappen", "team": "Red Bull Racing"},
    {"name": "Yuki Tsunoda", "team": "Red Bull Racing"},

    {"name": "Charles Leclerc", "team": "Ferrari"},
    {"name": "Lewis Hamilton", "team": "Ferrari"},

    {"name": "George Russell", "team": "Mercedes"},
    {"name": "Andrea Kimi Antonelli", "team": "Mercedes"},

    {"name": "Lando Norris", "team": "McLaren"},
    {"name": "Oscar Piastri", "team": "McLaren"},

    {"name": "Fernando Alonso", "team": "Aston Martin"},
    {"name": "Lance Stroll", "team": "Aston Martin"},

    {"name": "Pierre Gasly", "team": "Alpine"},
    {"name": "Franco Colapinto", "team": "Alpine"},

    {"name": "Esteban Ocon", "team": "Haas"},
    {"name": "Oliver Bearman", "team": "Haas"},

    {"name": "Liam Lawson", "team": "Racing Bulls"},
    {"name": "Isack Hadjar", "team": "Racing Bulls"},

    {"name": "Alexander Albon", "team": "Williams"},
    {"name": "Carlos Sainz", "team": "Williams"},

    {"name": "Nico Hulkenberg", "team": "Kick Sauber"},
    {"name": "Gabriel Bortoleto", "team": "Kick Sauber"}
]

    
    probabilities = []
    for driver in drivers:
        features = _build_race_features(driver["name"], driver["team"], race_name, date)
        
        # Simple race-aware probability calculation
        # Base probability from driver ranking
        base_prob = 0.05  # 5% base for all drivers
        
        # Driver-specific adjustments
        if "Verstappen" in driver["name"]:
            base_prob += 0.15  # +15% for Verstappen
        elif "Norris" in driver["name"]:
            base_prob += 0.12  # +12% for Norris
        elif "Piastri" in driver["name"]:
            base_prob += 0.10  # +10% for Piastri
        elif "Hamilton" in driver["name"]:
            base_prob += 0.08  # +8% for Hamilton
        elif "Leclerc" in driver["name"]:
            base_prob += 0.07  # +7% for Leclerc
        
        # Team adjustments
        if "Red Bull" in driver["team"]:
            base_prob += 0.05
        elif "McLaren" in driver["team"]:
            base_prob += 0.04
        elif "Ferrari" in driver["team"]:
            base_prob += 0.03
        elif "Mercedes" in driver["team"]:
            base_prob += 0.02
        
        # Circuit-specific adjustments
        if features["is_street_circuit"]:
            # Street circuits favor different drivers
            if "Alonso" in driver["name"]:
                base_prob += 0.06
            elif "Leclerc" in driver["name"]:
                base_prob += 0.04
        else:
            # Permanent circuits
            if "Verstappen" in driver["name"]:
                base_prob += 0.03
            elif "Norris" in driver["name"]:
                base_prob += 0.02
        
        # Season progression adjustment
        if features["season_round"] > 10:
            # Later in season, form matters more
            if "Norris" in driver["name"] or "Piastri" in driver["name"]:
                base_prob += 0.02
        
        # Add some randomness for variety
        import random
        random.seed(hash(f"{race_name}_{driver['name']}") % 1000)
        base_prob += random.uniform(-0.02, 0.02)
        
        # Ensure probability is reasonable
        base_prob = max(0.01, min(0.25, base_prob))
        
        probabilities.append({
            "driver": driver["name"],
            "prob": base_prob,
            "features": features
        })
    
    # Normalize to sum to 1.0
    total_prob = sum(p["prob"] for p in probabilities)
    for p in probabilities:
        p["prob"] = p["prob"] / total_prob
    
    return probabilities

def _load_probabilities(name: str, date: str | None) -> list[dict] | None:
    try:
        # 1) Try simplified prediction system first (most accurate)
        if True:  # Always use simplified predictions
            drivers = [
                {"name": "Lando Norris", "team": "McLaren-Mercedes"},
                {"name": "Oscar Piastri", "team": "McLaren-Mercedes"},
                {"name": "Max Verstappen", "team": "Red Bull Racing-Honda RBPT"},
                {"name": "George Russell", "team": "Mercedes"},
                {"name": "Charles Leclerc", "team": "Ferrari"},
                {"name": "Lewis Hamilton", "team": "Ferrari"},
                {"name": "Carlos Sainz", "team": "Williams-Mercedes"},
                {"name": "Fernando Alonso", "team": "Aston Martin-Mercedes"},
                {"name": "Lance Stroll", "team": "Aston Martin-Mercedes"},
                {"name": "Pierre Gasly", "team": "Alpine-Renault"},
                {"name": "Esteban Ocon", "team": "Haas-Ferrari"},
                {"name": "Nico Hulkenberg", "team": "Kick Sauber-Ferrari"},
                {"name": "Yuki Tsunoda", "team": "Red Bull Racing-Honda RBPT"},
                {"name": "Alexander Albon", "team": "Williams-Mercedes"},
                {"name": "Liam Lawson", "team": "Racing Bulls-Honda RBPT"},
                {"name": "Isack Hadjar", "team": "Racing Bulls-Honda RBPT"},
                {"name": "Oliver Bearman", "team": "Haas-Ferrari"},
                {"name": "Gabriel Bortoleto", "team": "Kick Sauber-Ferrari"},
                {"name": "Franco Colapinto", "team": "Alpine-Renault"},
                {"name": "Andrea Kimi Antonelli", "team": "Mercedes"}
            ]
            
            # REMOVED: Direct winner prediction - now using probability engine
            # ml_predictions = predict_race_winner_probabilities(name, date, drivers)
        
        # 2) Try backend ML pipeline
        res = get_race_prediction(name=name, date=date)
        if res and res.get("probabilities"):
            return res.get("probabilities")
        
        # 3) Fallback to dynamic race-aware probabilities
        print(f"Using dynamic predictions for {name}")
        return _get_dynamic_probabilities(name, date)
    except HTTPException as e:
        if e.status_code == 404:
            # Use dynamic probabilities as fallback
            return _get_dynamic_probabilities(name, date)
        raise


def _apply_house_margin(probs: list[float], margin: float) -> list[float]:
    if not probs:
        return []
    base_sum = sum(probs)
    if base_sum <= 0:
        return [0.0 for _ in probs]
    # Scale probs to include house edge and renormalize
    scaled = [p / (1.0 - margin) for p in probs]
    s = sum(scaled)
    return [p / s for p in scaled]


@app.get("/betting/markets")
def get_betting_markets(name: str, date: str | None = None, margin: float = 0.07):
    probs = _load_probabilities(name, date)
    if not probs:
        raise HTTPException(status_code=404, detail="no market available")
    drivers = [r["driver"] for r in probs]
    p_list = [float(r.get("prob", 0.0)) for r in probs]
    adj = _apply_house_margin(p_list, margin)
    markets = []
    for d, p in zip(drivers, adj):
        p = max(p, 1e-6)
        odds = round(1.0 / p, 2)
        markets.append({"driver": d, "prob": round(p, 4), "odds": odds})
    return {"race": name, "date": date, "markets": markets, "margin": margin}


@app.post("/betting/place")
def place_bet(payload: Dict[str, Any]):
    user_id = str(payload.get("userId"))
    race = str(payload.get("race"))
    date = str(payload.get("date", ""))
    driver = str(payload.get("driver"))
    stake = int(payload.get("stake", 0))  # store as integer units (e.g., cents or points)
    if not all([user_id, race, driver]) or stake <= 0:
        raise HTTPException(status_code=400, detail="invalid bet payload")

    # Get current odds
    mkt = get_betting_markets(name=race, date=date)
    pick = next((m for m in mkt["markets"] if m["driver"].lower() == driver.lower()), None)
    if pick is None:
        raise HTTPException(status_code=404, detail="driver not offered")
    odds = float(pick["odds"])

    conn = _db()
    cur = conn.cursor()
    # Ensure user exists and has balance
    cur.execute("SELECT id, balance FROM users WHERE id=?", (user_id,))
    row = cur.fetchone()
    if row is None:
        # create with initial demo balance
        cur.execute("INSERT INTO users(id, username, balance, created_at) VALUES(?,?,?,?)",
                    (user_id, user_id, 10000, datetime.utcnow().isoformat()))
        conn.commit()
        bal = 10000
    else:
        bal = int(row["balance"])
    if bal < stake:
        conn.close()
        raise HTTPException(status_code=400, detail="insufficient balance")

    # Deduct and store bet
    cur.execute("UPDATE users SET balance=balance-? WHERE id=?", (stake, user_id))
    cur.execute(
        "INSERT INTO bets(user_id, race_name, race_date, driver, stake, odds, status, created_at) VALUES(?,?,?,?,?,?,?,?)",
        (user_id, race, date, driver, stake, odds, "pending", datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
    return {"placed": True, "odds": odds, "stake": stake}


@app.post("/betting/settle")
def settle_race(name: str, date: str | None = None, winner: str = ""):
    if not winner:
        raise HTTPException(status_code=400, detail="winner is required")
    return _settle_race_internal(name, date, winner)


def _settle_race_internal(name: str, date: str | None, winner: str):
    conn = _db()
    cur = conn.cursor()
    cur.execute("SELECT id, user_id, stake, odds, driver FROM bets WHERE race_name=? AND (race_date=? OR ?='') AND status='pending'",
                (name, date or "", date or ""))
    rows = cur.fetchall()
    settled = 0
    for r in rows:
        bet_id = r["id"]
        uid = r["user_id"]
        stake = int(r["stake"])
        odds = float(r["odds"])
        drv = r["driver"]
        if drv.strip().lower() == winner.strip().lower():
            payout = int(round(stake * odds))
            cur.execute("UPDATE bets SET status='won', payout=? WHERE id=?", (payout, bet_id))
            cur.execute("UPDATE users SET balance=balance+? WHERE id=?", (payout, uid))
        else:
            cur.execute("UPDATE bets SET status='lost', payout=0 WHERE id=?", (bet_id,))
        settled += 1
    conn.commit()
    conn.close()
    return {"settled": settled, "winner": winner}


@app.get("/profile/{user_id}")
def get_profile(user_id: str, status: str | None = Query(None), race: str | None = Query(None)):
    conn = _db()
    cur = conn.cursor()
    cur.execute("SELECT id, username, balance, created_at FROM users WHERE id=?", (user_id,))
    u = cur.fetchone()
    if u is None:
        # auto-create minimal profile with initial demo balance
        cur.execute("INSERT INTO users(id, username, balance, created_at) VALUES(?,?,?,?)",
                    (user_id, user_id, 10000, datetime.utcnow().isoformat()))
        conn.commit()
        cur.execute("SELECT id, username, balance, created_at FROM users WHERE id=?", (user_id,))
        u = cur.fetchone()
    query = "SELECT race_name, race_date, driver, stake, odds, status, payout, created_at FROM bets WHERE user_id=?"
    params: list = [user_id]
    if status:
        query += " AND status=?"
        params.append(status)
    if race:
        query += " AND race_name=?"
        params.append(race)
    query += " ORDER BY id DESC"
    cur.execute(query, tuple(params))
    bets = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {
        "userId": u["id"],
        "username": u["username"],
        "balance": int(u["balance"]),
        "createdAt": u["created_at"],
        "bets": bets,
    }


@app.get("/leaderboard")
def get_leaderboard(limit: int = 10):
    conn = _db()
    cur = conn.cursor()
    # Compute total won/lost per user
    cur.execute(
        """
        SELECT u.id as userId, u.username, u.balance,
               COALESCE(SUM(CASE WHEN b.status='won' THEN b.payout - b.stake ELSE 0 END),0) AS profit,
               COALESCE(SUM(CASE WHEN b.status='lost' THEN b.stake ELSE 0 END),0) AS total_lost
        FROM users u
        LEFT JOIN bets b ON b.user_id = u.id
        GROUP BY u.id
        ORDER BY u.balance DESC, profit DESC
        LIMIT ?
        """,
        (limit,)
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"leaders": rows}


# ---------------- Background automation: auto-settlement + periodic bonus ----------------
# REMOVED: CSV pipeline functions - All data now flows through Supabase
# _results_csv_paths() and _find_winner_in_results() removed


async def _auto_settle_loop():
    # run hourly
    while True:
        try:
            conn = _db()
            cur = conn.cursor()
            cur.execute("SELECT DISTINCT race_name, race_date FROM bets WHERE status='pending'")
            pending = cur.fetchall()
            conn.close()
            for r in pending:
                rname = r["race_name"]
                rdate = r["race_date"]
                # REMOVED: CSV-based winner lookup - now using Supabase/Jolpica
                # Winner settlement will be handled by new result service
                # winner = _find_winner_in_results(rname, rdate)
                # if winner:
                #     _settle_race_internal(rname, rdate, winner)
        except Exception as e:
            print(f"auto_settle error: {e}")
        await asyncio.sleep(3600)


async def _bonus_loop():
    # add 1000 credits every 4 hours
    while True:
        try:
            conn = _db()
            cur = conn.cursor()
            cur.execute("UPDATE users SET balance = balance + 1000")
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"bonus loop error: {e}")
        await asyncio.sleep(4 * 60 * 60)


@app.on_event("startup")
async def _startup_tasks():
    # Load race prediction model
    load_race_model()
    
    # launch background loops
    asyncio.create_task(_auto_settle_loop())
    asyncio.create_task(_bonus_loop())

@app.get("/f1/drivers")
def get_drivers(year: int = 2024):
    """Get F1 drivers using FastF1"""
    return {"drivers": get_f1_drivers(year)}

@app.get("/f1/races")
def get_races(year: int = 2024):
    """Get F1 race calendar using FastF1"""
    return {"races": get_f1_races(year)}

@app.get("/f1/results/{year}/{round}")
def get_results(year: int, round: int):
    """Get race results using FastF1"""
    return {"results": get_race_results(year, round)}

@app.get("/f1/driver/{driver_id}/stats")
def get_driver_statistics(driver_id: str, year: int = 2024):
    """Get driver statistics using FastF1"""
    return {"stats": get_driver_stats(driver_id, year)}

@app.post("/predict")
def predict(req: PredictRequest):
    # Use FastF1 to get current drivers
    try:
        drivers = get_f1_drivers(2024)
    except Exception as e:
        print(f"FastF1 drivers fetch failed: {e}")
        # Fallback to Firestore or local data
        try:
            drivers_ref = db.collection("drivers")
            drivers_docs = list(drivers_ref.stream())
            drivers = [doc.to_dict() for doc in drivers_docs]
        except Exception as e2:
            print(f"Firestore fallback failed: {e2}")
            drivers = [{"firstName": "Max", "lastName": "Verstappen"}, {"firstName": "Lando", "lastName": "Norris"}]

    driver_names = [f"{d.get('firstName','').strip()} {d.get('lastName','').strip()}".strip() for d in drivers]
    driver_names = [n for n in driver_names if n]
    if not driver_names:
        raise HTTPException(status_code=500, detail="No drivers available for prediction")

    X = preprocess_features(drivers, req.dict())

    mdl = load_model_if_needed()
    if mdl is not None:
        try:
            raw = mdl.predict(X, verbose=0)
            probs = postprocess_predictions(np.array(raw))
        except Exception as e:
            print(f"Predict failed: {e}")
            raw = np.random.rand(len(driver_names))
            probs = (raw / raw.sum()).astype(float).tolist()
    else:
        raw = np.random.rand(len(driver_names))
        probs = (raw / raw.sum()).astype(float).tolist()

    return {
        "drivers": [
            {"name": name, "probability": round(prob * 100, 2)}
            for name, prob in zip(driver_names, probs)
        ],
        "lastUpdated": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/predict/test")
def predict_test():
    sample = [
        {"firstName": "Max", "lastName": "Verstappen"},
        {"firstName": "Lando", "lastName": "Norris"},
        {"firstName": "Charles", "lastName": "Leclerc"},
    ]
    X = preprocess_features(sample, {})
    mdl = load_model_if_needed()
    if mdl is not None:
        try:
            raw = mdl.predict(X, verbose=0)
            probs = postprocess_predictions(np.array(raw))
        except Exception:
            raw = np.random.rand(len(sample))
            probs = (raw / raw.sum()).astype(float).tolist()
    else:
        raw = np.random.rand(len(sample))
        probs = (raw / raw.sum()).astype(float).tolist()
    names = [f"{d['firstName']} {d['lastName']}" for d in sample]
    return {"drivers": [{"name": n, "probability": round(p * 100, 2)} for n, p in zip(names, probs)]}

# Fantasy points helpers
def _calc_refill(last_refill: Any, current_balance: int) -> tuple[int, Any]:
    now = datetime.now(timezone.utc)
    try:
        last = last_refill if isinstance(last_refill, datetime) else datetime.fromisoformat(str(last_refill))
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
    except Exception:
        last = now
    hours_passed = (now - last).total_seconds() / 3600.0
    if hours_passed < POINTS_REFILL_INTERVAL_HOURS:
        return 0, last
    intervals = int(hours_passed // POINTS_REFILL_INTERVAL_HOURS)
    points_to_add = intervals * POINTS_REFILL_AMOUNT
    new_balance = min(current_balance + points_to_add, POINTS_MAX_CAP)
    points_added = max(new_balance - current_balance, 0)
    new_last_refill = last + timedelta(hours=intervals * POINTS_REFILL_INTERVAL_HOURS)
    return points_added, new_last_refill

@app.post("/users/{uid}/init_points")
def init_points(uid: str):
    doc_ref = db.collection("users").document(uid)
    snap = doc_ref.get()
    now = datetime.now(timezone.utc)
    if snap.exists:
        data = snap.to_dict() or {}
        if data.get("points_balance") is None:
            doc_ref.update({
                "points_balance": POINTS_SIGNUP_CREDIT,
                "last_refill": now.isoformat(),
            })
            return {"initialized": True, "balance": POINTS_SIGNUP_CREDIT}
        return {"initialized": False, "balance": data.get("points_balance", 0)}
    else:
        doc_ref.set({
            "points_balance": POINTS_SIGNUP_CREDIT,
            "last_refill": now.isoformat(),
        })
        return {"initialized": True, "balance": POINTS_SIGNUP_CREDIT}

@app.get("/users/{uid}/balance")
def get_balance(uid: str):
    doc_ref = db.collection("users").document(uid)
    snap = doc_ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="User not found")
    data = snap.to_dict() or {}
    return {
        "points_balance": int(data.get("points_balance", 0)),
        "last_refill": data.get("last_refill")
    }

@app.post("/users/{uid}/refill")
def refill_points(uid: str):
    doc_ref = db.collection("users").document(uid)
    snap = doc_ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="User not found")
    data = snap.to_dict() or {}
    current_balance = int(data.get("points_balance", 0))
    points_added, new_last = _calc_refill(data.get("last_refill"), current_balance)
    if points_added > 0:
        doc_ref.update({
            "points_balance": current_balance + points_added,
            "last_refill": str(new_last)
        })
    return {"added": points_added, "new_balance": min(current_balance + points_added, POINTS_MAX_CAP)}

@app.post("/cron/refill_points")
def cron_refill_points():
    # Intended to be triggered by Cloud Scheduler; idempotent
    users_ref = db.collection("users")
    count = 0
    for doc in users_ref.stream():
        data = doc.to_dict() or {}
        current_balance = int(data.get("points_balance", 0))
        added, new_last = _calc_refill(data.get("last_refill"), current_balance)
        if added > 0:
            doc.reference.update({
                "points_balance": current_balance + added,
                "last_refill": str(new_last)
            })
            count += 1
    return {"refilled_users": count}

@app.post("/leaderboard/snapshot")
def create_leaderboard_snapshot():
    """Create a daily snapshot of leaderboard for profit delta calculations"""
    try:
        conn = sqlite3.connect('f1_prediction_market.db')
        cur = conn.cursor()
        
        # Get current leaderboard
        cur.execute("""
            SELECT id, username, balance, 
                   (SELECT COUNT(*) FROM bets WHERE user_id = users.id AND status = 'won') as wins,
                   (SELECT COUNT(*) FROM bets WHERE user_id = users.id AND status = 'lost') as losses,
                   (SELECT COALESCE(SUM(payout), 0) FROM bets WHERE user_id = users.id AND status = 'won') as total_winnings,
                   (SELECT COALESCE(SUM(stake), 0) FROM bets WHERE user_id = users.id AND status = 'lost') as total_losses
            FROM users 
            ORDER BY balance DESC
        """)
        rows = cur.fetchall()
        
        today = datetime.now().strftime('%Y-%m-%d')
        snapshot_data = {
            'date': today,
            'timestamp': datetime.now().isoformat(),
            'leaders': []
        }
        
        for i, row in enumerate(rows):
            user_id, username, balance, wins, losses, total_winnings, total_losses = row
            profit = total_winnings - total_losses
            snapshot_data['leaders'].append({
                'rank': i + 1,
                'userId': user_id,
                'username': username,
                'balance': balance,
                'wins': wins,
                'losses': losses,
                'profit': profit
            })
        
        # Store snapshot in database
        cur.execute("""
            INSERT OR REPLACE INTO leaderboard_snapshots (date, snapshot_data)
            VALUES (?, ?)
        """, (today, json.dumps(snapshot_data)))
        conn.commit()
        
        conn.close()
        return {"success": True, "date": today, "users_snapshot": len(snapshot_data['leaders'])}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/leaderboard/delta")
def get_leaderboard_delta():
    """Get profit deltas since yesterday's snapshot"""
    try:
        conn = sqlite3.connect('f1_prediction_market.db')
        cur = conn.cursor()
        
        # Get yesterday's snapshot
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        cur.execute("SELECT snapshot_data FROM leaderboard_snapshots WHERE date = ?", (yesterday,))
        row = cur.fetchone()
        
        if not row:
            return {"success": False, "error": "No yesterday snapshot found"}
        
        yesterday_data = json.loads(row[0])
        yesterday_profits = {user['userId']: user['profit'] for user in yesterday_data['leaders']}
        
        # Get current leaderboard
        cur.execute("""
            SELECT id, username, balance, 
                   (SELECT COALESCE(SUM(payout), 0) FROM bets WHERE user_id = users.id AND status = 'won') as total_winnings,
                   (SELECT COALESCE(SUM(stake), 0) FROM bets WHERE user_id = users.id AND status = 'lost') as total_losses
            FROM users 
            ORDER BY balance DESC
        """)
        rows = cur.fetchall()
        
        deltas = []
        for i, row in enumerate(rows):
            user_id, username, balance, total_winnings, total_losses = row
            current_profit = total_winnings - total_losses
            yesterday_profit = yesterday_profits.get(user_id, 0)
            profit_delta = current_profit - yesterday_profit
            
            deltas.append({
                'rank': i + 1,
                'userId': user_id,
                'username': username,
                'balance': balance,
                'profit': current_profit,
                'profitDelta': profit_delta,
                'profitDeltaPct': (profit_delta / yesterday_profit * 100) if yesterday_profit > 0 else 0
            })
        
        conn.close()
        return {"success": True, "deltas": deltas}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# New hybrid prediction endpoints
import logging
import asyncio
from typing import List, Dict, Optional
from datetime import datetime

# Import existing services
from services.MLPredictionService import MLPredictionService
from services.HybridPredictionService import HybridPredictionService, RacePrediction, DriverPrediction
from data.drivers import F1DataService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="F1 Prediction API",
    description="Hybrid F1 race prediction system combining ML, calibration, and live data",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ml_prediction_service = MLPredictionService()
hybrid_service = HybridPredictionService()
data_service = F1DataService()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "services": {
            "ml_prediction_service": "active",
            "hybrid_service": "active",
            "data_service": "active"
        }
    }

# Enhanced Hybrid Prediction Endpoints
@app.get("/predict/next-race", response_model=RacePrediction)
async def predict_next_race():
    """
    Get comprehensive enhanced hybrid predictions for the upcoming race.
    Combines ML models, calibration factors, track adjustments, live data,
    weather conditions, and rich driver metadata.
    """
    try:
        logger.info("Generating enhanced hybrid predictions for next race...")
        prediction = await hybrid_service.predict_next_race()
        return prediction
    except Exception as e:
        logger.error(f"Error generating enhanced hybrid predictions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate enhanced predictions: {str(e)}"
        )

@app.get("/predict/{race_identifier}")
async def predict_specific_race(race_identifier: str):
    """
    Get enhanced hybrid predictions for a specific race.
    Can use race name, circuit ID, or round number.
    
    Examples:
    - /predict/Monaco%20Grand%20Prix
    - /predict/monaco
    - /predict/6
    """
    try:
        logger.info(f"Generating predictions for race: {race_identifier}")
        prediction = await hybrid_service.predict_race(race_identifier)
        return prediction
    except Exception as e:
        logger.error(f"Error generating race predictions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate race predictions: {str(e)}"
        )

@app.get("/predict/next-race/simple")
async def predict_next_race_simple():
    """
    Get simplified predictions for the upcoming race (driver rankings only).
    """
    try:
        prediction = await hybrid_service.predict_next_race()
        
        # Return simplified format
        simple_predictions = []
        for i, driver_pred in enumerate(prediction.predictions):
            simple_predictions.append({
                "position": i + 1,
                "driverId": driver_pred.driverId,
                "driverName": driver_pred.driverName,
                "constructor": driver_pred.constructor,
                "probability": round(driver_pred.probability * 100, 1),  # Convert to percentage
                "confidence": driver_pred.confidence
            })
        
        return {
            "race": prediction.race,
            "round": prediction.round,
            "season": prediction.season,
            "date": prediction.date,
            "track_type": prediction.track_type,
            "predictions": simple_predictions,
            "generated_at": prediction.generated_at,
            "model_version": prediction.model_version
        }
    except Exception as e:
        logger.error(f"Error generating simple predictions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate simple predictions: {str(e)}"
        )

@app.post("/train")
async def retrain_model(background_tasks: BackgroundTasks):
    """
    Trigger retraining of the hybrid prediction model.
    This runs in the background to avoid blocking the API.
    """
    try:
        logger.info("🔄 Triggering hybrid model retraining...")
        
        # Add retraining task to background
        background_tasks.add_task(hybrid_service.retrain)
        
        return {
            "status": "success",
            "message": "Hybrid prediction model retraining started in background",
            "triggered_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error triggering retraining: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to trigger retraining: {str(e)}"
        )

@app.get("/train/status")
async def get_training_status():
    """
    Get the current status of model training.
    """
    return {
        "status": "idle",  # This would track actual training status
        "last_trained": datetime.now().isoformat(),
        "model_version": hybrid_service.model_version,
        "next_scheduled": None
    }

# Track-Specific Prediction Endpoints
@app.get("/predict/track-specific/{race_identifier}")
async def predict_track_specific_race(
    race_identifier: str,
    weather: str = Query("dry", description="Weather condition"),
    temperature: float = Query(25.0, description="Temperature in Celsius"),
    humidity: float = Query(60.0, description="Humidity percentage"),
    wind_speed: float = Query(5.0, description="Wind speed in km/h")
):
    """
    Get comprehensive track-specific predictions for a specific Grand Prix.
    Includes all factors: track characteristics, weather, tires, driver weights, and McLaren dominance.
    
    Args:
        race_identifier: Race name, circuit, or round number
        weather: Weather condition (dry, wet, intermediate, mixed)
        temperature: Temperature in Celsius
        humidity: Humidity percentage
        wind_speed: Wind speed in km/h
    
    Returns:
        Complete Grand Prix prediction with all factors
    """
    try:
        from services.TrackSpecificPredictionService import TrackSpecificPredictionService
        
        logger.info(f"Generating track-specific predictions for: {race_identifier}")
        
        # Initialize the track-specific prediction service
        service = TrackSpecificPredictionService()
        
        # Generate predictions
        prediction = await service.predict_grand_prix(
            race_identifier, weather, temperature, humidity, wind_speed
        )
        
        # Convert to serializable format
        serializable_prediction = {
            "race_name": prediction.race_name,
            "circuit": prediction.circuit,
            "round": prediction.round,
            "date": prediction.date,
            "country": prediction.country,
            "city": prediction.city,
            "track_type": prediction.track_type,
            "track_length": prediction.track_length,
            "corners": prediction.corners,
            "straights": prediction.straights,
            "high_speed_corners": prediction.high_speed_corners,
            "medium_speed_corners": prediction.medium_speed_corners,
            "low_speed_corners": prediction.low_speed_corners,
            "overtaking_opportunities": prediction.overtaking_opportunities,
            "weather_condition": prediction.weather_condition,
            "temperature_range": prediction.temperature_range,
            "humidity_range": prediction.humidity_range,
            "wind_conditions": prediction.wind_conditions,
            "tire_compounds": prediction.tire_compounds,
            "expected_degradation": prediction.expected_degradation,
            "pit_stop_strategy": prediction.pit_stop_strategy,
            "expected_race_pace": prediction.expected_race_pace,
            "key_factors": prediction.key_factors,
            "surprise_potential": prediction.surprise_potential,
            "generated_at": prediction.generated_at,
            "model_version": prediction.model_version,
            "simulation_count": prediction.simulation_count,
            "driver_predictions": []
        }
        
        # Convert driver predictions
        for driver_pred in prediction.driver_predictions:
            driver_dict = {
                "driver_id": driver_pred.driver_id,
                "driver_name": driver_pred.driver_name,
                "constructor": driver_pred.constructor,
                "constructor_id": driver_pred.constructor_id,
                "nationality": driver_pred.nationality,
                "win_probability": driver_pred.win_probability,
                "podium_probability": driver_pred.podium_probability,
                "points_probability": driver_pred.points_probability,
                "expected_position": driver_pred.expected_position,
                "track_performance_multiplier": driver_pred.track_performance_multiplier,
                "weather_adjustment": driver_pred.weather_adjustment,
                "tire_degradation_factor": driver_pred.tire_degradation_factor,
                "fuel_efficiency_bonus": driver_pred.fuel_efficiency_bonus,
                "brake_wear_impact": driver_pred.brake_wear_impact,
                "downforce_advantage": driver_pred.downforce_advantage,
                "power_sensitivity_bonus": driver_pred.power_sensitivity_bonus,
                "driver_weight": driver_pred.driver_weight,
                "team_weight": driver_pred.team_weight,
                "season_form": driver_pred.season_form,
                "track_history": driver_pred.track_history,
                "confidence_score": driver_pred.confidence_score,
                "uncertainty_factor": driver_pred.uncertainty_factor,
                "qualifying_potential": driver_pred.qualifying_potential,
                "race_pace_advantage": driver_pred.race_pace_advantage,
                "tire_management_skill": driver_pred.tire_management_skill,
                "wet_weather_advantage": driver_pred.wet_weather_advantage
            }
            serializable_prediction["driver_predictions"].append(driver_dict)
        
        return serializable_prediction
        
    except Exception as e:
        logger.error(f"Error generating track-specific predictions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate track-specific predictions: {str(e)}"
        )

@app.get("/predict/track-specific/all")
async def predict_all_track_specific_races(
    weather: str = Query("dry", description="Weather condition for all races")
):
    """
    Get track-specific predictions for all Grand Prix in the 2025 season.
    Includes all factors: track characteristics, weather, tires, driver weights, and McLaren dominance.
    
    Args:
        weather: Weather condition to apply to all races (dry, wet, intermediate, mixed)
    
    Returns:
        List of all Grand Prix predictions with comprehensive factors
    """
    try:
        from services.TrackSpecificPredictionService import TrackSpecificPredictionService
        
        logger.info("Generating track-specific predictions for all Grand Prix")
        
        # Initialize the track-specific prediction service
        service = TrackSpecificPredictionService()
        
        # Generate predictions for all races
        all_predictions = await service.predict_all_grand_prix(weather)
        
        # Convert to serializable format
        serializable_predictions = []
        for prediction in all_predictions:
            pred_dict = {
                "race_name": prediction.race_name,
                "circuit": prediction.circuit,
                "round": prediction.round,
                "date": prediction.date,
                "country": prediction.country,
                "city": prediction.city,
                "track_type": prediction.track_type,
                "track_length": prediction.track_length,
                "corners": prediction.corners,
                "straights": prediction.straights,
                "high_speed_corners": prediction.high_speed_corners,
                "medium_speed_corners": prediction.medium_speed_corners,
                "low_speed_corners": prediction.low_speed_corners,
                "overtaking_opportunities": prediction.overtaking_opportunities,
                "weather_condition": prediction.weather_condition,
                "temperature_range": prediction.temperature_range,
                "humidity_range": prediction.humidity_range,
                "wind_conditions": prediction.wind_conditions,
                "tire_compounds": prediction.tire_compounds,
                "expected_degradation": prediction.expected_degradation,
                "pit_stop_strategy": prediction.pit_stop_strategy,
                "expected_race_pace": prediction.expected_race_pace,
                "key_factors": prediction.key_factors,
                "surprise_potential": prediction.surprise_potential,
                "generated_at": prediction.generated_at,
                "model_version": prediction.model_version,
                "simulation_count": prediction.simulation_count,
                "driver_predictions": []
            }
            
            # Convert driver predictions
            for driver_pred in prediction.driver_predictions:
                driver_dict = {
                    "driver_id": driver_pred.driver_id,
                    "driver_name": driver_pred.driver_name,
                    "constructor": driver_pred.constructor,
                    "constructor_id": driver_pred.constructor_id,
                    "nationality": driver_pred.nationality,
                    "win_probability": driver_pred.win_probability,
                    "podium_probability": driver_pred.podium_probability,
                    "points_probability": driver_pred.points_probability,
                    "expected_position": driver_pred.expected_position,
                    "track_performance_multiplier": driver_pred.track_performance_multiplier,
                    "weather_adjustment": driver_pred.weather_adjustment,
                    "tire_degradation_factor": driver_pred.tire_degradation_factor,
                    "fuel_efficiency_bonus": driver_pred.fuel_efficiency_bonus,
                    "brake_wear_impact": driver_pred.brake_wear_impact,
                    "downforce_advantage": driver_pred.downforce_advantage,
                    "power_sensitivity_bonus": driver_pred.power_sensitivity_bonus,
                    "driver_weight": driver_pred.driver_weight,
                    "team_weight": driver_pred.team_weight,
                    "season_form": driver_pred.season_form,
                    "track_history": driver_pred.track_history,
                    "confidence_score": driver_pred.confidence_score,
                    "uncertainty_factor": driver_pred.uncertainty_factor,
                    "qualifying_potential": driver_pred.qualifying_potential,
                    "race_pace_advantage": driver_pred.race_pace_advantage,
                    "tire_management_skill": driver_pred.tire_management_skill,
                    "wet_weather_advantage": driver_pred.wet_weather_advantage
                }
                pred_dict["driver_predictions"].append(driver_dict)
            
            serializable_predictions.append(pred_dict)
        
        return {
            "total_races": len(serializable_predictions),
            "weather_condition": weather,
            "generated_at": datetime.now().isoformat(),
            "predictions": serializable_predictions
        }
        
    except Exception as e:
        logger.error(f"Error generating all track-specific predictions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate all track-specific predictions: {str(e)}"
        )

@app.get("/predict/track-specific/next-race")
async def predict_next_race_track_specific(
    weather: str = Query("dry", description="Weather condition"),
    temperature: float = Query(25.0, description="Temperature in Celsius"),
    humidity: float = Query(60.0, description="Humidity percentage"),
    wind_speed: float = Query(5.0, description="Wind speed in km/h")
):
    """
    Get track-specific predictions for the next upcoming race.
    Includes all factors: track characteristics, weather, tires, driver weights, and McLaren dominance.
    
    Args:
        weather: Weather condition (dry, wet, intermediate, mixed)
        temperature: Temperature in Celsius
        humidity: Humidity percentage
        wind_speed: Wind speed in km/h
    
    Returns:
        Next race prediction with comprehensive factors
    """
    try:
        from services.TrackSpecificPredictionService import TrackSpecificPredictionService
        
        logger.info("Generating track-specific predictions for next race")
        
        # Initialize the track-specific prediction service
        service = TrackSpecificPredictionService()
        
        # Generate predictions for next race
        prediction = await service.predict_next_race()
        
        # Apply weather conditions
        prediction.weather_condition = weather
        prediction.temperature_range = (temperature - 5, temperature + 5)
        prediction.humidity_range = (humidity - 10, humidity + 10)
        prediction.wind_conditions = f"{wind_speed} km/h"
        
        # Convert to serializable format (same as above)
        serializable_prediction = {
            "race_name": prediction.race_name,
            "circuit": prediction.circuit,
            "round": prediction.round,
            "date": prediction.date,
            "country": prediction.country,
            "city": prediction.city,
            "track_type": prediction.track_type,
            "track_length": prediction.track_length,
            "corners": prediction.corners,
            "straights": prediction.straights,
            "high_speed_corners": prediction.high_speed_corners,
            "medium_speed_corners": prediction.medium_speed_corners,
            "low_speed_corners": prediction.low_speed_corners,
            "overtaking_opportunities": prediction.overtaking_opportunities,
            "weather_condition": prediction.weather_condition,
            "temperature_range": prediction.temperature_range,
            "humidity_range": prediction.humidity_range,
            "wind_conditions": prediction.wind_conditions,
            "tire_compounds": prediction.tire_compounds,
            "expected_degradation": prediction.expected_degradation,
            "pit_stop_strategy": prediction.pit_stop_strategy,
            "expected_race_pace": prediction.expected_race_pace,
            "key_factors": prediction.key_factors,
            "surprise_potential": prediction.surprise_potential,
            "generated_at": prediction.generated_at,
            "model_version": prediction.model_version,
            "simulation_count": prediction.simulation_count,
            "driver_predictions": []
        }
        
        # Convert driver predictions
        for driver_pred in prediction.driver_predictions:
            driver_dict = {
                "driver_id": driver_pred.driver_id,
                "driver_name": driver_pred.driver_name,
                "constructor": driver_pred.constructor,
                "constructor_id": driver_pred.constructor_id,
                "nationality": driver_pred.nationality,
                "win_probability": driver_pred.win_probability,
                "podium_probability": driver_pred.podium_probability,
                "points_probability": driver_pred.points_probability,
                "expected_position": driver_pred.expected_position,
                "track_performance_multiplier": driver_pred.track_performance_multiplier,
                "weather_adjustment": driver_pred.weather_adjustment,
                "tire_degradation_factor": driver_pred.tire_degradation_factor,
                "fuel_efficiency_bonus": driver_pred.fuel_efficiency_bonus,
                "brake_wear_impact": driver_pred.brake_wear_impact,
                "downforce_advantage": driver_pred.downforce_advantage,
                "power_sensitivity_bonus": driver_pred.power_sensitivity_bonus,
                "driver_weight": driver_pred.driver_weight,
                "team_weight": driver_pred.team_weight,
                "season_form": driver_pred.season_form,
                "track_history": driver_pred.track_history,
                "confidence_score": driver_pred.confidence_score,
                "uncertainty_factor": driver_pred.uncertainty_factor,
                "qualifying_potential": driver_pred.qualifying_potential,
                "race_pace_advantage": driver_pred.race_pace_advantage,
                "tire_management_skill": driver_pred.tire_management_skill,
                "wet_weather_advantage": driver_pred.wet_weather_advantage
            }
            serializable_prediction["driver_predictions"].append(driver_dict)
        
        return serializable_prediction
        
    except Exception as e:
        logger.error(f"Error generating next race track-specific predictions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate next race track-specific predictions: {str(e)}"
        )

# Calendar and Weather Information Endpoints
@app.get("/calendar/season")
async def get_season_calendar():
    """
    Get the complete F1 2025 season calendar.
    """
    try:
        calendar_info = hybrid_service.calendar_service.get_season_info()
        return calendar_info
    except Exception as e:
        logger.error(f"Error fetching season calendar: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch season calendar: {str(e)}"
        )

@app.get("/calendar/races")
async def get_all_races():
    """
    Get all races in the 2025 F1 season.
    """
    try:
        races = hybrid_service.calendar_service.get_all_races()
        return {"races": races, "total": len(races)}
    except Exception as e:
        logger.error(f"Error fetching races: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch races: {str(e)}"
        )

@app.get("/calendar/race/{race_identifier}")
async def get_race_info(race_identifier: str):
    """
    Get detailed information about a specific race.
    """
    try:
        race_info = hybrid_service.calendar_service.get_race(race_identifier)
        if not race_info:
            raise HTTPException(
                status_code=404,
                detail=f"Race '{race_identifier}' not found"
            )
        return race_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching race info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch race info: {str(e)}"
        )

@app.get("/weather/forecast/{race_identifier}")
async def get_race_weather(race_identifier: str):
    """
    Get weather forecast for a specific race.
    """
    try:
        # Get race info first
        race_info = hybrid_service.calendar_service.get_race(race_identifier)
        if not race_info:
            raise HTTPException(
                status_code=404,
                detail=f"Race '{race_identifier}' not found"
            )
        
        # Get weather forecast
        weather = hybrid_service.weather_service.get_forecast(race_info["name"])
        return {
            "race": race_info["name"],
            "circuit": race_info["circuit"],
            "weather": weather
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching weather forecast: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch weather forecast: {str(e)}"
        )

# Driver Information Endpoints
@app.get("/drivers/entry-list/{round}")
async def get_driver_entry_list(round: int):
    """
    Get the driver entry list for a specific race round.
    """
    try:
        entry_list = await data_service.get_entry_list_for_gp(round)
        if not entry_list:
            raise HTTPException(
                status_code=404,
                detail=f"No driver entry list found for round {round}"
            )
        return {
            "round": round,
            "entry_list": entry_list,
            "total_drivers": len(entry_list)
        }
    except Exception as e:
        logger.error(f"Error getting entry list: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get entry list: {str(e)}"
        )

@app.get("/drivers/standings")
async def get_driver_standings():
    """
    Get current driver standings for the season.
    """
    try:
        # This would integrate with your standings service
        # For now, returning placeholder data
        return {
            "season": 2025,
            "standings": [],
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting standings: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get standings: {str(e)}"
        )

# Track Information Endpoints
@app.get("/tracks/{circuit_id}")
async def get_track_info(circuit_id: str):
    """
    Get information about a specific F1 circuit.
    """
    track_info = {
        "circuit_id": circuit_id,
        "track_type": hybrid_service._classify_track(circuit_id),
        "adjustment_factor": hybrid_service.track_adjustments.get(
            hybrid_service._classify_track(circuit_id), 1.0
        )
    }
    return track_info

# Weather Information Endpoints
@app.get("/weather/{circuit_id}")
async def get_weather_info(circuit_id: str):
    """
    Get weather information for a specific circuit (placeholder).
    """
    weather_info = hybrid_service._get_weather_conditions({"circuitId": circuit_id})
    return {
        "circuit_id": circuit_id,
        "weather": weather_info,
        "last_updated": datetime.now().isoformat()
    }

# Model Information Endpoints
@app.get("/models/info")
async def get_model_info():
    """
    Get information about the current prediction models.
    """
    return {
        "hybrid_model": {
            "version": hybrid_service.model_version,
            "type": "Hybrid (ML + Calibration + Track + Weather)",
            "components": [
                "XGBoost ML Models",
                "Driver Tier Calibration",
                "Team Performance Weights",
                "Track-Specific Adjustments",
                "Weather Condition Factors",
                "Live Data Integration"
            ]
        },
        "ml_models": {
            "type": "XGBoost",
            "features": [
                "Driver Performance",
                "Team Performance",
                "Track History",
                "Season Form",
                "Qualifying Results"
            ]
        },
        "calibration": {
            "driver_tiers": len(hybrid_service.driver_tiers),
            "team_weights": len(hybrid_service.team_weights),
            "track_adjustments": len(hybrid_service.track_adjustments),
            "weather_multipliers": len(hybrid_service.weather_multipliers)
        }
    }

# Legacy endpoints (for backward compatibility)
@app.get("/predict/legacy")
async def legacy_predictions():
    """
    Legacy prediction endpoint for backward compatibility.
    """
    try:
        # Use the existing prediction service
        predictions = await prediction_service.get_race_predictions()
        return {
            "source": "legacy",
            "predictions": predictions,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in legacy predictions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Legacy prediction service error: {str(e)}"
        )

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("F1 Prediction API starting up...")
    logger.info(f"Hybrid service initialized: {hybrid_service.model_version}")
    logger.info("All services ready")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("F1 Prediction API shutting down...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)