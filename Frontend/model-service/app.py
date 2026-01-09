from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import joblib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Allow CORS for Vite dev server
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

# Global variables for ML model and data
ml_model = None
scaler = None
feature_columns = None
driver_stats = None
track_features = None

# Track characteristics and dominance factors
TRACK_CHARACTERISTICS = {
    "Monaco Grand Prix": {
        "type": "street_circuit",
        "difficulty": "very_high",
        "overtaking": "very_difficult",
        "qualifying_importance": "critical",
        "weather_sensitivity": "high",
        "dominance_factors": ["qualifying_performance", "street_circuit_experience", "precision_driving"],
        "track_features": {
            "corners": 19,
            "straights": 2,
            "elevation_changes": "high",
            "surface_grip": "medium",
            "runoff_areas": "minimal"
        }
    },
    "Dutch Grand Prix": {
        "type": "permanent_circuit",
        "difficulty": "medium",
        "overtaking": "moderate",
        "qualifying_importance": "high",
        "weather_sensitivity": "medium",
        "dominance_factors": ["high_speed_corners", "aero_efficiency", "tire_management"],
        "track_features": {
            "corners": 14,
            "straights": 3,
            "elevation_changes": "medium",
            "surface_grip": "high",
            "runoff_areas": "extensive"
        }
    },
    "British Grand Prix": {
        "type": "permanent_circuit",
        "difficulty": "high",
        "overtaking": "moderate",
        "qualifying_importance": "high",
        "weather_sensitivity": "high",
        "dominance_factors": ["high_speed_corners", "weather_adaptability", "home_advantage"],
        "track_features": {
            "corners": 18,
            "straights": 4,
            "elevation_changes": "high",
            "surface_grip": "medium",
            "runoff_areas": "extensive"
        }
    },
    "Italian Grand Prix": {
        "type": "permanent_circuit",
        "difficulty": "medium",
        "overtaking": "easy",
        "qualifying_importance": "medium",
        "weather_sensitivity": "low",
        "dominance_factors": ["straight_line_speed", "engine_power", "low_downforce_setup"],
        "track_features": {
            "corners": 11,
            "straights": 5,
            "elevation_changes": "low",
            "surface_grip": "high",
            "runoff_areas": "extensive"
        }
    },
    "Singapore Grand Prix": {
        "type": "street_circuit",
        "difficulty": "very_high",
        "overtaking": "very_difficult",
        "qualifying_importance": "critical",
        "weather_sensitivity": "high",
        "dominance_factors": ["street_circuit_experience", "endurance", "precision_driving"],
        "track_features": {
            "corners": 23,
            "straights": 3,
            "elevation_changes": "medium",
            "surface_grip": "low",
            "runoff_areas": "minimal"
        }
    }
}

# Driver track dominance history (enhanced with more realistic data)
DRIVER_TRACK_DOMINANCE = {
    "Max Verstappen": {
        "Monaco Grand Prix": {"wins": 2, "poles": 3, "podiums": 4, "dominance_score": 0.85, "avg_position": 2.2},
        "Dutch Grand Prix": {"wins": 3, "poles": 3, "podiums": 3, "dominance_score": 0.95, "avg_position": 1.0},
        "British Grand Prix": {"wins": 1, "poles": 2, "podiums": 3, "dominance_score": 0.75, "avg_position": 3.1},
        "Italian Grand Prix": {"wins": 1, "poles": 1, "podiums": 2, "dominance_score": 0.70, "avg_position": 4.2},
        "Singapore Grand Prix": {"wins": 1, "poles": 1, "podiums": 2, "dominance_score": 0.65, "avg_position": 4.8}
    },
    "Lando Norris": {
        "Monaco Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.45, "avg_position": 8.5},
        "Dutch Grand Prix": {"wins": 0, "poles": 0, "podiums": 2, "dominance_score": 0.60, "avg_position": 6.2},
        "British Grand Prix": {"wins": 0, "poles": 1, "podiums": 1, "dominance_score": 0.55, "avg_position": 7.1},
        "Italian Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.40, "avg_position": 9.3},
        "Singapore Grand Prix": {"wins": 0, "poles": 0, "podiums": 0, "dominance_score": 0.35, "avg_position": 10.1}
    },
    "Lewis Hamilton": {
        "Monaco Grand Prix": {"wins": 3, "poles": 3, "podiums": 5, "dominance_score": 0.80, "avg_position": 2.8},
        "Dutch Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.45, "avg_position": 8.9},
        "British Grand Prix": {"wins": 8, "poles": 7, "podiums": 12, "dominance_score": 0.90, "avg_position": 1.9},
        "Italian Grand Prix": {"wins": 5, "poles": 4, "podiums": 8, "dominance_score": 0.85, "avg_position": 2.4},
        "Singapore Grand Prix": {"wins": 4, "poles": 3, "podiums": 6, "dominance_score": 0.80, "avg_position": 2.7}
    },
    "Charles Leclerc": {
        "Monaco Grand Prix": {"wins": 1, "poles": 2, "podiums": 2, "dominance_score": 0.70, "avg_position": 3.5},
        "Dutch Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.50, "avg_position": 7.8},
        "British Grand Prix": {"wins": 0, "poles": 1, "podiums": 2, "dominance_score": 0.60, "avg_position": 6.5},
        "Italian Grand Prix": {"wins": 1, "poles": 1, "podiums": 3, "dominance_score": 0.75, "avg_position": 4.1},
        "Singapore Grand Prix": {"wins": 0, "poles": 0, "podiums": 1, "dominance_score": 0.45, "avg_position": 8.2}
    }
}

def load_ml_model():
    """Load the trained XGBoost model and scaler"""
    global ml_model, scaler, feature_columns
    
    try:
        # Path to the ML model files
        model_path = Path(__file__).parent.parent / 'f1_prediction_system' / 'f1_prediction_model.joblib'
        scaler_path = Path(__file__).parent.parent / 'f1_prediction_system' / 'f1_scaler.joblib'
        feature_path = Path(__file__).parent.parent / 'f1_prediction_system' / 'feature_columns.csv'
        
        if model_path.exists() and scaler_path.exists():
            ml_model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            logger.info("✅ ML model and scaler loaded successfully")
            
            if feature_path.exists():
                feature_df = pd.read_csv(feature_path)
                feature_columns = feature_df['feature'].tolist()
                logger.info(f"✅ Loaded {len(feature_columns)} feature columns")
            else:
                logger.warning("⚠️ Feature columns file not found")
                feature_columns = []
        else:
            logger.warning("⚠️ ML model files not found, using fallback predictions")
            ml_model = None
            scaler = None
            feature_columns = []
            
    except Exception as e:
        logger.error(f"❌ Error loading ML model: {e}")
        ml_model = None
        scaler = None
        feature_columns = []

def load_driver_data():
    """Load driver statistics and track baselines"""
    global driver_stats, track_features
    
    try:
        # Load driver statistics
        stats_path = Path(__file__).parent.parent / 'f1_prediction_system' / 'driver_statistics.csv'
        if stats_path.exists():
            driver_stats = pd.read_csv(stats_path)
            logger.info("✅ Driver statistics loaded")
        else:
            driver_stats = pd.DataFrame()
            logger.warning("⚠️ Driver statistics not found")
            
        # Load track features
        track_path = Path(__file__).parent.parent / 'f1_prediction_system' / 'data' / 'raw' / 'track_features.csv'
        if track_path.exists():
            track_features = pd.read_csv(track_path)
            logger.info("✅ Track features loaded")
        else:
            track_features = pd.DataFrame()
            logger.warning("⚠️ Track features not found")
            
    except Exception as e:
        logger.error(f"❌ Error loading driver data: {e}")
        driver_stats = pd.DataFrame()
        track_features = pd.DataFrame()

def calculate_driver_season_form(driver_name: str) -> float:
    """Calculate driver's 2025 season form based on recent performance"""
    try:
        if driver_stats.empty:
            return 0.5
            
        driver_data = driver_stats[driver_stats['driver'] == driver_name]
        if driver_data.empty:
            return 0.5
            
        # Get recent form score if available
        if 'recent_form_score' in driver_data.columns:
            form_score = driver_data['recent_form_score'].iloc[0]
            return max(0.1, min(1.0, form_score))
            
        # Fallback calculation
        if 'total_points' in driver_data.columns:
            points = driver_data['total_points'].iloc[0]
            position = driver_data.get('position', [20]).iloc[0]
            
            # Calculate form score (0-1)
            max_points = 100  # Approximate max points after few races
            position_penalty = (position - 1) * 0.05
            
            form_score = min(1.0, max(0.1, (points / max_points) - position_penalty))
            return form_score
        
        return 0.5
        
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

def apply_weather_adjustments(base_prob: float, weather: dict, track_type: str) -> float:
    """Apply weather-based adjustments to driver probabilities"""
    try:
        adjustment = 1.0
        
        # Temperature effects
        temp_c = weather.get('tempC', 24)
        if temp_c > 30:
            adjustment *= 0.95  # Hot weather slightly reduces performance
        elif temp_c < 10:
            adjustment *= 0.97  # Cold weather slightly reduces performance
            
        # Rain effects
        rain_chance = weather.get('rainChancePct', 18)
        if rain_chance > 50:
            adjustment *= 0.90  # Heavy rain significantly reduces performance
        elif rain_chance > 20:
            adjustment *= 0.95  # Light rain slightly reduces performance
            
        # Wind effects
        wind_kmh = weather.get('windKmh', 21)
        if wind_kmh > 30:
            adjustment *= 0.93  # High winds reduce performance
        elif wind_kmh > 20:
            adjustment *= 0.97  # Moderate winds slightly reduce performance
            
        # Track type specific adjustments
        if track_type == "street_circuit" and rain_chance > 30:
            adjustment *= 0.92  # Street circuits are more sensitive to rain
            
        return max(0.1, min(1.0, base_prob * adjustment))
        
    except Exception as e:
        logger.warning(f"Error applying weather adjustments: {e}")
        return base_prob

def generate_ml_features(driver_name: str, race_name: str, weather: dict, track_info: dict) -> np.ndarray:
    """Generate ML features for the trained model"""
    try:
        if not feature_columns or ml_model is None:
            return None
            
        # Initialize feature vector with zeros
        features = np.zeros(len(feature_columns))
        
        # Get driver statistics
        driver_data = driver_stats[driver_stats['driver'] == driver_name] if not driver_stats.empty else pd.DataFrame()
        
        # Fill in available features
        for i, feature in enumerate(feature_columns):
            if feature in driver_data.columns and not driver_data.empty:
                features[i] = driver_data[feature].iloc[0]
            elif feature == 'weather_impact':
                # Calculate weather impact score
                weather_score = 1.0
                if weather.get('rainChancePct', 0) > 30:
                    weather_score *= 0.8
                if weather.get('windKmh', 0) > 25:
                    weather_score *= 0.9
                features[i] = weather_score
            elif feature == 'track_advantage':
                # Calculate track advantage based on dominance
                track_dominance = calculate_track_dominance_score(driver_name, race_name)
                features[i] = track_dominance
            elif feature == 'recent_form_score':
                # Use season form
                features[i] = calculate_driver_season_form(driver_name)
            else:
                # Use default values for missing features
                features[i] = 0.5
        
        # Reshape for model input
        features = features.reshape(1, -1)
        
        # Scale features if scaler is available
        if scaler is not None:
            features = scaler.transform(features)
            
        return features
        
    except Exception as e:
        logger.error(f"Error generating ML features: {e}")
        return None

def predict_with_ml_model(driver_name: str, race_name: str, weather: dict, track_info: dict) -> tuple:
    """Use the trained ML model to predict win probability"""
    try:
        if ml_model is None:
            return None, None
            
        # Generate features
        features = generate_ml_features(driver_name, race_name, weather, track_info)
        if features is None:
            return None, None
            
        # Make prediction
        win_prob = ml_model.predict_proba(features)[0, 1]  # Probability of winning
        
        # Apply weather adjustments
        adjusted_prob = apply_weather_adjustments(win_prob, weather, track_info.get('type', 'permanent_circuit'))
        
        return adjusted_prob, win_prob
        
    except Exception as e:
        logger.error(f"Error predicting with ML model: {e}")
        return None, None

def generate_dynamic_predictions(race_name: str, race_date: str, weather: dict) -> list:
    """Generate dynamic predictions considering track dominance, season form, weather, and ML model"""
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
            # Try ML model prediction first
            ml_win_prob, base_ml_prob = predict_with_ml_model(driver_name, race_name, weather, track_info)
            
            if ml_win_prob is not None:
                # Use ML model prediction
                win_prob_pct = ml_win_prob * 100
                logger.info(f"ML prediction for {driver_name}: {win_prob_pct:.2f}%")
            else:
                # Fallback to rule-based prediction
                season_form = calculate_driver_season_form(driver_name)
                track_dominance = calculate_track_dominance_score(driver_name, race_name)
                team_performance = 0.7  # Default, could be enhanced with constructor standings
                
                # Calculate base win probability
                base_prob = (season_form * 0.4 + track_dominance * 0.4 + team_performance * 0.2)
                
                # Apply weather adjustments
                adjusted_prob = apply_weather_adjustments(base_prob, weather, track_info["type"])
                win_prob_pct = adjusted_prob * 100
                logger.info(f"Rule-based prediction for {driver_name}: {win_prob_pct:.2f}%")
            
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
            
            # Track history
            track_history = {
                "wins": DRIVER_TRACK_DOMINANCE.get(driver_name, {}).get(race_name, {}).get("wins", 0),
                "poles": DRIVER_TRACK_DOMINANCE.get(driver_name, {}).get(race_name, {}).get("poles", 0),
                "podiums": DRIVER_TRACK_DOMINANCE.get(driver_name, {}).get(race_name, {}).get("podiums", 0),
                "avg_position": DRIVER_TRACK_DOMINANCE.get(driver_name, {}).get(race_name, {}).get("avg_position", 10.0)
            }
            
            prediction = {
                'driverId': str(i + 1),
                'driverName': driver_name,
                'team': team,
                'winProbPct': round(win_prob_pct, 2),
                'podiumProbPct': round(podium_prob_pct, 2),
                'position': i + 1,
                'trackHistory': track_history,
                'seasonForm': round(calculate_driver_season_form(driver_name), 3),
                'predictionMethod': 'ML Model' if ml_win_prob is not None else 'Rule-based'
            }
            
            predictions.append(prediction)
        
        # Sort by win probability and reassign positions
        predictions.sort(key=lambda x: x['winProbPct'], reverse=True)
        for i, pred in enumerate(predictions):
            pred['position'] = i + 1
        
        # Normalize probabilities to sum to ~100%
        total_prob = sum(p['winProbPct'] for p in predictions)
        if total_prob > 0:
            for pred in predictions:
                pred['winProbPct'] = round((pred['winProbPct'] / total_prob) * 100, 2)
        
        return predictions
        
    except Exception as e:
        logger.error(f"Error generating dynamic predictions: {e}")
        return []

@app.route('/live/status', methods=['GET'])
def live_status():
    return jsonify({
        'status': 'pre_race',
        'current_session': None,
        'last_update': datetime.utcnow().isoformat() + 'Z',
        'connected_clients': 0
    })

@app.route('/live/race/<int:year>/<int:round>', methods=['GET'])
def live_race(year: int, round: int):
    # Minimal stub so frontend stops polling errors
    return jsonify({
        'positions': [],
        'lap_number': 0,
        'total_laps': 0,
        'race_time': '00:00',
        'lap_times': [],
        'live_odds': {},
        'last_update': datetime.utcnow().isoformat() + 'Z'
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'ml-service'})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        # Placeholder for ML prediction logic
        return jsonify({
            'success': True,
            'prediction': 'Sample prediction',
            'confidence': 0.85
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/betting/markets', methods=['GET'])
def betting_markets():
    name = request.args.get('name', default='Dutch Grand Prix', type=str)
    date = request.args.get('date', default=datetime.utcnow().date().isoformat(), type=str)
    # Simple synthetic markets so UI has data
    drivers = [
        'Max Verstappen','Lando Norris','Oscar Piastri','George Russell','Lewis Hamilton',
        'Charles Leclerc','Carlos Sainz','Fernando Alonso','Lance Stroll','Pierre Gasly',
        'Esteban Ocon','Nico Hulkenberg','Kevin Magnussen','Yuki Tsunoda','Daniel Ricciardo',
        'Alexander Albon','Valtteri Bottas','Zhou Guanyu','Andrea Kimi Antonelli','Oliver Bearman']
    base = 0.18
    markets = []
    for i, d in enumerate(drivers):
        prob = max(0.005, base - i * 0.006)
        odds = max(1.01, round(1.0 / prob, 2))
        markets.append({'driver': d, 'prob': round(prob, 4), 'odds': odds})
    margin = max(0.05, sum(m['prob'] for m in markets) - 1.0)
    return jsonify({'race': name, 'date': date, 'margin': round(margin * 100, 2), 'markets': markets})

@app.route('/betting/place', methods=['POST'])
def betting_place():
    payload = request.get_json(force=True, silent=True) or {}
    driver = payload.get('driver')
    stake = float(payload.get('stake', 0))
    if not driver or stake <= 0:
        return jsonify({'placed': False, 'error': 'Invalid bet'}), 400
    # Echo back simple success
    return jsonify({'placed': True, 'odds': 2.5, 'stake': stake})

@app.route('/profile/<user_id>', methods=['GET'])
def profile(user_id: str):
    # Minimal guest profile stub
    return jsonify({
        'userId': user_id,
        'username': user_id[:12],
        'balance': 1000,
        'createdAt': datetime.utcnow().isoformat() + 'Z',
        'bets': []
    })

@app.route('/users/profile', methods=['GET'])
def users_profile():
    """Endpoint for /users/profile that frontend calls"""
    # Get user ID from query params or headers
    user_id = request.args.get('userId') or request.headers.get('X-User-ID', 'guest')
    
    return jsonify({
        'userId': user_id,
        'username': user_id[:12] if user_id != 'guest' else 'Guest User',
        'balance': 1000,
        'createdAt': datetime.utcnow().isoformat() + 'Z',
        'bets': []
    })


def _repo_root() -> Path:
    # this file is project/model-service/app.py → repo root is two levels up from here
    return Path(__file__).resolve().parents[2]


def _final_predictions_dir() -> Path:
    # Prefer env override when running in containers
    env_dir = os.environ.get('PREDICTIONS_DIR')
    if env_dir:
        return Path(env_dir)
    return _repo_root() / 'project' / 'f1_prediction_system' / 'final_predictions'


def _calibration_metrics_file() -> Path:
    env_path = os.environ.get('CALIBRATION_METRICS_FILE')
    if env_path:
        return Path(env_path)
    return _repo_root() / 'project' / 'f1_prediction_system' / 'calibration_models' / 'overall_metrics.json'


def _multi_race_predictions_file() -> Path:
    base = _repo_root() / 'project' / 'f1_prediction_system'
    candidates = [
        base / 'multi_race_predictions.csv',
        base / 'enhanced_monte_carlo_results_calibrated.csv',
        base / 'enhanced_monte_carlo_results.csv',
    ]
    for p in candidates:
        if p.exists():
            return p
    return candidates[0]


def _processed_dir() -> Path:
    return _repo_root() / 'project' / 'f1_prediction_system' / 'data' / 'processed'


def _track_features_file() -> Path:
    return _repo_root() / 'project' / 'f1_prediction_system' / 'data' / 'raw' / 'track_features.csv'


def _load_track_row(race_name: str, date_str: str | None) -> dict:
    try:
        tf = _track_features_file()
        if not tf.exists():
            return {}
        tdf = pd.read_csv(tf)
        if tdf.empty:
            return {}
        # try to match by date first if present
        if date_str and 'event_id' in tdf.columns and tdf['event_id'].astype(str).str.contains(date_str, na=False).any():
            row = tdf[tdf['event_id'].astype(str).str.contains(date_str, na=False)].iloc[0].to_dict()
            return row
        # fallback: match by track_name containing part of race_name
        name_key = race_name.split(' Grand Prix')[0] if 'Grand Prix' in race_name else race_name
        for col in ['track_name', 'circuit', 'race', 'race_name']:
            if col in tdf.columns:
                mask = tdf[col].astype(str).str.lower().str.contains(name_key.lower())
                if mask.any():
                    return tdf[mask].iloc[0].to_dict()
        return {}
    except Exception:
        return {}


def _load_calibration_metrics() -> dict:
    try:
        metrics_path = _calibration_metrics_file()
        if metrics_path.exists():
            with open(metrics_path, 'r') as f:
                data = json.load(f)
                return data or {}
    except Exception:
        pass
    return {}


@app.route('/predictions/latest', methods=['GET'])
def latest_predictions():
    try:
        race_name = request.args.get('race', default='Monaco Grand Prix', type=str)
        # Build path to latest CSV produced by smart_cleanup: latest_<race>.csv
        filename = f"latest_{race_name}.csv"
        csv_path = _final_predictions_dir() / filename

        if not csv_path.exists():
            # Fallback: try to find a results_ file for this race
            candidates = sorted(_final_predictions_dir().glob(f"results_{race_name}_*.csv"))
            if not candidates:
                # Fallback 2: use aggregated multi-race predictions and filter by race
                multi = _multi_race_predictions_file()
                if multi.exists():
                    df_all = pd.read_csv(multi)
                    race_col = None
                    for c in df_all.columns:
                        if c.lower() in ('race','race_name','event','event_name'):
                            race_col = c
                            break
                    if race_col is None or df_all.empty:
                        return jsonify({'success': False, 'error': 'Aggregated predictions missing race column'}), 500
                    mask = df_all[race_col].astype(str).str.lower().str.contains(race_name.lower())
                    df = df_all[mask].copy()
                    if df.empty:
                        mask2 = df_all[race_col].astype(str).str.strip().str.casefold() == race_name.strip().casefold()
                        df = df_all[mask2].copy()
                    if df.empty:
                        return jsonify({'success': False, 'error': f'No rows for race {race_name} in aggregated predictions'}), 404
                    # proceed with df directly
                    work_df = df
                    driver_col = next((c for c in work_df.columns if c.lower() in ('driver','driver_name','name')), None)
                    team_col = next((c for c in work_df.columns if c.lower() in ('team','constructor')), None)
                    win_col = next((c for c in work_df.columns if c.lower() in ('win_prob','win_probability','winprob','winprob_pct','win_prob_pct')), None)
                    podium_col = next((c for c in work_df.columns if c.lower() in ('podium_prob','podium_probability','podium_prob_pct')), None)
                    if win_col is None:
                        for c in work_df.columns:
                            if 'win' in c.lower() and 'prob' in c.lower():
                                win_col = c
                                break
                    if driver_col is None or win_col is None:
                        return jsonify({'success': False, 'error': 'Required columns not found in aggregated predictions'}), 500
                    work_df = work_df.sort_values(win_col, ascending=False).reset_index(drop=True)
                    def to_pct(x):
                        try:
                            return float(x) * 100.0 if float(x) <= 1.0 else float(x)
                        except Exception:
                            return 0.0
                    predictions_all = []
                    for idx, row in work_df.iterrows():
                        predictions_all.append({
                            'driverId': str(row.get(driver_col)).lower().replace(' ', '_'),
                            'driverName': str(row.get(driver_col)),
                            'team': str(row.get(team_col)) if team_col else 'Unknown',
                            'winProbPct': round(to_pct(row.get(win_col)), 2),
                            'podiumProbPct': round(to_pct(row.get(podium_col)) if podium_col and pd.notna(row.get(podium_col)) else max(0.0, min(100.0, round(to_pct(row.get(win_col)) * 2.5, 2))), 2),
                            'position': idx + 1
                        })
                    top3 = predictions_all[:3]
                    metrics = _load_calibration_metrics()
                    accuracy = metrics.get('overall_accuracy_pct') or metrics.get('accuracy_pct') or 88
                    mean_error = metrics.get('overall_mae_seconds') or metrics.get('mean_error_sec') or 0.8
                    response = {
                        'raceId': race_name,
                        'generatedAt': datetime.utcnow().isoformat() + 'Z',
                        'weatherUsed': {
                            'date': datetime.utcnow().date().isoformat(),
                            'tempC': 24,
                            'windKmh': 21,
                            'rainChancePct': 18,
                            'condition': 'Sunny'
                        },
                        'top3': top3,
                        'all': predictions_all,
                        'modelStats': {
                            'accuracyPct': accuracy,
                            'meanErrorSec': mean_error,
                            'trees': 233,
                            'lr': 0.1
                        }
                    }
                    return jsonify(response)
                else:
                    # Final fallback: use most recent predictions file in the directory
                    any_results = sorted(_final_predictions_dir().glob("results_*.csv"))
                    if not any_results:
                        return jsonify({'success': False, 'error': f'No predictions found (race={race_name})'}), 404
                    csv_path = any_results[-1]

        df = pd.read_csv(csv_path)
        if df.empty:
            return jsonify({'success': False, 'error': 'Prediction file is empty'}), 500

        # Normalize expected columns
        # columns may include: race, driver, team, win_prob, podium_prob, points_prob
        # Convert probabilities to percentages
        def get_col(name_options):
            for opt in name_options:
                if opt in df.columns:
                    return opt
            return None

        driver_col = get_col(['driver', 'Driver'])
        team_col = get_col(['team', 'Team'])
        race_col = get_col(['race', 'Race'])
        win_col = get_col(['win_prob', 'win_probability', 'Win Probability', 'winProb'])
        podium_col = get_col(['podium_prob', 'Podium Probability', 'podiumProb'])

        if not driver_col or not win_col:
            return jsonify({'success': False, 'error': 'Required columns not found in predictions CSV'}), 500

        # Sort by win probability desc
        df_sorted = df.sort_values(win_col, ascending=False).reset_index(drop=True)

        def to_pct(x):
            try:
                # treat values <= 1 as probabilities, otherwise already percent
                return float(x) * 100.0 if float(x) <= 1.0 else float(x)
            except Exception:
                return 0.0

        predictions_all = []
        for idx, row in df_sorted.iterrows():
            predictions_all.append({
                'driverId': str(row.get(driver_col)).lower().replace(' ', '_'),
                'driverName': str(row.get(driver_col)),
                'team': str(row.get(team_col)) if team_col else 'Unknown',
                'winProbPct': round(to_pct(row.get(win_col)), 2),
                'podiumProbPct': round(to_pct(row.get(podium_col)) if podium_col and pd.notna(row.get(podium_col)) else max(0.0, min(100.0, round(to_pct(row.get(win_col)) * 2.5, 2))), 2),
                'position': idx + 1
            })

        top3 = predictions_all[:3]

        # model stats from calibration if available
        metrics = _load_calibration_metrics()
        accuracy = metrics.get('overall_accuracy_pct') or metrics.get('accuracy_pct') or 88
        mean_error = metrics.get('overall_mae_seconds') or metrics.get('mean_error_sec') or 0.8

        response = {
            'raceId': (str(df_sorted[race_col].iloc[0]) if race_col and not df_sorted.empty else race_name),
            'generatedAt': datetime.utcnow().isoformat() + 'Z',
            'weatherUsed': {
                'date': datetime.utcnow().date().isoformat(),
                'tempC': 24,
                'windKmh': 21,
                'rainChancePct': 18,
                'condition': 'Sunny'
            },
            'top3': top3,
            'all': predictions_all,
            'modelStats': {
                'accuracyPct': accuracy,
                'meanErrorSec': mean_error,
                'trees': 233,
                'lr': 0.1
            }
        }

        return jsonify(response)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/predictions/race', methods=['GET'])
def predictions_by_race():
    """Serve per-race predictions with dynamic weather/track details.
    Query params: name=<race name>, date=<YYYY-MM-DD>
    Sources priority:
      1) final_predictions/latest_<name>.csv
      2) final_predictions/results_<name>_*.csv
      3) processed calibrated: data/processed/calibrated_*.csv (match by date or name)
      4) aggregated fallback files
      5) dynamic generation for missing races
    """
    try:
        race_name = request.args.get('name', type=str)
        date_str = request.args.get('date', default=None, type=str)
        if not race_name:
            return jsonify({'success': False, 'error': 'Missing race name'}), 400

        # 1/2: reuse latest endpoint resolution pathing
        filename = f"latest_{race_name}.csv"
        csv_path = _final_predictions_dir() / filename
        df = None
        if csv_path.exists():
            df = pd.read_csv(csv_path)
            logger.info(f"✅ Found existing predictions for {race_name}")
        else:
            candidates = sorted(_final_predictions_dir().glob(f"results_{race_name}_*.csv"))
            if candidates:
                df = pd.read_csv(candidates[-1])
                logger.info(f"✅ Found historical predictions for {race_name}")

        # 3) processed calibrated
        if df is None:
            pdir = _processed_dir()
            if pdir.exists():
                # match by event_id contains date first
                cands = sorted(pdir.glob("calibrated_*.csv"))
                pick = None
                if date_str:
                    for p in cands:
                        if date_str in p.stem:
                            pick = p
                            break
                if pick is None:
                    # fallback: open and match by track name column
                    for p in cands:
                        try:
                            tmp = pd.read_csv(p, nrows=50)
                            for col in ['track_name','circuit','race','race_name','event_id']:
                                if col in tmp.columns and tmp[col].astype(str).str.lower().str.contains(race_name.lower()).any():
                                    pick = p
                                    break
                            if pick:
                                break
                        except Exception:
                            continue
                if pick:
                    df = pd.read_csv(pick)
                    logger.info(f"✅ Found calibrated predictions for {race_name}")

        # 4) aggregated fallback
        if df is None:
            multi = _multi_race_predictions_file()
            if multi.exists():
                all_df = pd.read_csv(multi)
                for col in ['race','race_name','event','event_name']:
                    if col in all_df.columns:
                        m = all_df[col].astype(str).str.lower().str.contains(race_name.lower())
                        if m.any():
                            df = all_df[m].copy()
                            logger.info(f"✅ Found aggregated predictions for {race_name}")
                            break

        # 5) Dynamic generation for missing races
        if df is None or df.empty:
            logger.info(f"🔄 No existing predictions found for {race_name}, generating dynamically")
            try:
                # Generate dynamic predictions
                weather = {
                    'date': date_str or datetime.utcnow().date().isoformat(),
                    'tempC': 24,
                    'windKmh': 21,
                    'rainChancePct': 18,
                    'condition': 'Sunny'
                }
                
                # Use the dynamic prediction function
                dynamic_predictions = generate_dynamic_predictions(race_name, date_str or datetime.utcnow().date().isoformat(), weather)
                
                if dynamic_predictions:
                    # Convert to DataFrame format
                    df_data = []
                    for pred in dynamic_predictions:
                        df_data.append({
                            'driverName': pred['driverName'],
                            'team': pred['team'],
                            'winProbPct': pred['winProbPct'],
                            'podiumProbPct': pred['podiumProbPct'],
                            'position': pred['position']
                        })
                    df = pd.DataFrame(df_data)
                    logger.info(f"✅ Generated dynamic predictions for {race_name}")
                else:
                    logger.warning(f"⚠️ Failed to generate dynamic predictions for {race_name}")
            except Exception as e:
                logger.error(f"❌ Error generating dynamic predictions for {race_name}: {e}")

        if df is None or df.empty:
            # Final fallback: return a basic response with sample data
            logger.warning(f"⚠️ No predictions available for {race_name}, using fallback data")
            fallback_data = [
                {'driverName': 'Max Verstappen', 'team': 'Red Bull Racing', 'winProbPct': 25.0, 'podiumProbPct': 75.0, 'position': 1},
                {'driverName': 'Lando Norris', 'team': 'McLaren', 'winProbPct': 20.0, 'podiumProbPct': 60.0, 'position': 2},
                {'driverName': 'Oscar Piastri', 'team': 'McLaren', 'winProbPct': 15.0, 'podiumProbPct': 45.0, 'position': 3},
                {'driverName': 'Lewis Hamilton', 'team': 'Ferrari', 'winProbPct': 12.0, 'podiumProbPct': 36.0, 'position': 4},
                {'driverName': 'Charles Leclerc', 'team': 'Ferrari', 'winProbPct': 10.0, 'podiumProbPct': 30.0, 'position': 5}
            ]
            df = pd.DataFrame(fallback_data)

        # Columns normalization
        def pick(df_, opts):
            for o in opts:
                if o in df_.columns:
                    return o
            return None

        driver_col = pick(df, ['driverName','driver','driver_name','Driver'])
        team_col = pick(df, ['team','constructor','Team'])
        win_col = pick(df, ['winProbPct','calibrated_prob','win_prob','win_probability','win_prob_model','winProb'])
        if win_col is None:
            # heuristic
            for c in df.columns:
                if 'win' in c.lower() and 'prob' in c.lower():
                    win_col = c; break
        if driver_col is None or win_col is None:
            return jsonify({'success': False, 'error': 'Required columns not found in prediction data'}), 500

        # Build response rows
        def to_pct(x):
            try:
                return float(x) * 100.0 if float(x) <= 1.0 else float(x)
            except Exception:
                return 0.0

        df_sorted = df.sort_values(win_col, ascending=False).reset_index(drop=True)
        predictions_all = []
        for idx, row in df_sorted.iterrows():
            predictions_all.append({
                'driverId': str(row.get(driver_col)).lower().replace(' ', '_'),
                'driverName': str(row.get(driver_col)),
                'team': str(row.get(team_col)) if team_col else 'Unknown',
                'winProbPct': round(to_pct(row.get(win_col)), 2),
                'podiumProbPct': round(min(100.0, to_pct(row.get(win_col)) * 2.5), 2),
                'position': idx + 1
            })

        top3 = predictions_all[:3]

        # Track/weather row
        track_row = _load_track_row(race_name, date_str)
        temp_c = track_row.get('tempC') or track_row.get('temperature_c') or 24
        wind = track_row.get('windKmh') or track_row.get('wind_kmh') or 21
        rain = track_row.get('rainChancePct') or (float(track_row.get('rain_prob')) * 100.0 if track_row.get('rain_prob') is not None else 18)
        cond = track_row.get('condition') or track_row.get('weather_condition') or 'Sunny'

        metrics = _load_calibration_metrics()
        accuracy = metrics.get('overall_accuracy_pct') or metrics.get('accuracy_pct') or 88
        mean_error = metrics.get('overall_mae_seconds') or metrics.get('mean_error_sec') or 0.8

        payload = {
            'raceId': race_name,
            'generatedAt': datetime.utcnow().isoformat() + 'Z',
            'weatherUsed': {
                'date': date_str or datetime.utcnow().date().isoformat(),
                'tempC': float(temp_c),
                'windKmh': float(wind),
                'rainChancePct': float(rain),
                'condition': str(cond)
            },
            'top3': top3,
            'all': predictions_all,
            'modelStats': {
                'accuracyPct': accuracy,
                'meanErrorSec': mean_error,
                'trees': 233,
                'lr': 0.1
            }
        }
        return jsonify(payload)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
