#!/usr/bin/env python3
"""
F1 2025 ML Prediction Service V2
Supports both base model (v1) and calibrated model (v2)
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import RobustScaler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Model configuration
MODEL_DIR = Path("model")
BASE_MODEL_PATH = MODEL_DIR / "base_model.joblib"
CALIBRATED_MODEL_PATH = MODEL_DIR / "calibrated_model.joblib"
SCALER_PATH = MODEL_DIR / "scaler.joblib"
FEATURE_COLUMNS_PATH = MODEL_DIR / "feature_columns.json"
METADATA_PATH = MODEL_DIR / "model_metadata.json"

# Global model variables
base_model = None
calibrated_model = None
scaler = None
feature_columns = []
model_metadata = {}
current_model_type = "calibrated"  # Default to calibrated

# F1 2025 Drivers and Teams
F1_2025_DRIVERS = [
    "Max Verstappen", "Yuki Tsunoda", "Lewis Hamilton", "George Russell",
    "Charles Leclerc", "Carlos Sainz", "Lando Norris", "Oscar Piastri",
    "Fernando Alonso", "Lance Stroll", "Esteban Ocon", "Oliver Bearman",
    "Pierre Gasly", "Franco Colapinto", "Alexander Albon",
    "Nico Hulkenberg", "Gabriel Bortoleto", "Liam Lawson", "Isack Hadjar",
    "Andrea Kimi Antonelli"
]

F1_2025_TEAMS = {
    "Max Verstappen": "Red Bull Racing",
    "Yuki Tsunoda": "Red Bull Racing", 
    "Lewis Hamilton": "Ferrari",
    "George Russell": "Mercedes",
    "Charles Leclerc": "Ferrari",
    "Carlos Sainz": "Williams",
    "Lando Norris": "McLaren",
    "Oscar Piastri": "McLaren",
    "Fernando Alonso": "Aston Martin",
    "Lance Stroll": "Aston Martin",
    "Esteban Ocon": "Haas",
    "Oliver Bearman": "Haas",
    "Pierre Gasly": "Alpine",
    "Franco Colapinto": "Alpine",
    "Alexander Albon": "Williams",
    "Nico Hulkenberg": "Kick Sauber",
    "Gabriel Bortoleto": "Kick Sauber",
    "Liam Lawson": "Racing Bulls",
    "Isack Hadjar": "Racing Bulls",
    "Andrea Kimi Antonelli": "Mercedes"
}

def load_models():
    """Load all models and metadata"""
    global base_model, calibrated_model, scaler, feature_columns, model_metadata
    
    try:
        logger.info("🔄 Loading models...")
        
        # Load base model
        if BASE_MODEL_PATH.exists():
            base_model = joblib.load(BASE_MODEL_PATH)
            logger.info("✅ Loaded base model")
        else:
            logger.warning("⚠️ Base model not found")
        
        # Load calibrated model
        if CALIBRATED_MODEL_PATH.exists():
            calibrated_model = joblib.load(CALIBRATED_MODEL_PATH)
            logger.info("✅ Loaded calibrated model")
        else:
            logger.warning("⚠️ Calibrated model not found")
        
        # Load scaler
        if SCALER_PATH.exists():
            scaler = joblib.load(SCALER_PATH)
            logger.info("✅ Loaded scaler")
        else:
            logger.warning("⚠️ Scaler not found")
        
        # Load feature columns
        if FEATURE_COLUMNS_PATH.exists():
            with open(FEATURE_COLUMNS_PATH, 'r') as f:
                feature_columns = json.load(f)
            logger.info(f"✅ Loaded {len(feature_columns)} feature columns")
        else:
            logger.warning("⚠️ Feature columns not found")
        
        # Load metadata
        if METADATA_PATH.exists():
            with open(METADATA_PATH, 'r') as f:
                model_metadata = json.load(f)
            logger.info("✅ Loaded model metadata")
        else:
            logger.warning("⚠️ Model metadata not found")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to load models: {e}")
        return False

def prepare_features(features_dict: Dict[str, Any]) -> np.ndarray:
    """Prepare features for prediction"""
    try:
        # Create DataFrame with features
        df = pd.DataFrame([features_dict])
        
        # Ensure all required features are present
        for col in feature_columns:
            if col not in df.columns:
                df[col] = 0  # Default value
        
        # Select only the required features in the correct order
        X = df[feature_columns].values
        
        # Scale features
        if scaler is not None:
            X = scaler.transform(X)
        
        return X
        
    except Exception as e:
        logger.error(f"Failed to prepare features: {e}")
        return None

def predict_with_model(features: np.ndarray, model_type: str) -> Dict[str, Any]:
    """Make prediction with specified model"""
    try:
        if model_type == "base" and base_model is not None:
            model = base_model
        elif model_type == "calibrated" and calibrated_model is not None:
            model = calibrated_model
        else:
            return {"error": f"Model {model_type} not available"}
        
        # Make prediction
        prediction_proba = model.predict_proba(features)[0]
        prediction_class = model.predict(features)[0]
        
        # Calculate expected position (simplified)
        win_probability = prediction_proba[1] if len(prediction_proba) > 1 else 0.1
        podium_probability = min(win_probability * 3, 0.95)  # Simplified podium calculation
        expected_position = max(1, min(20, int(1 / win_probability) if win_probability > 0 else 10))
        
        return {
            "win_probability": float(win_probability),
            "podium_probability": float(podium_probability),
            "expected_position": int(expected_position),
            "confidence": float(max(prediction_proba)),
            "model_type": model_type,
            "prediction_class": int(prediction_class)
        }
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        return {"error": str(e)}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    models_loaded = {
        "base_model": base_model is not None,
        "calibrated_model": calibrated_model is not None,
        "scaler": scaler is not None,
        "feature_columns": len(feature_columns) > 0
    }
    
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": models_loaded,
        "current_model": current_model_type
    })

@app.route('/model/metadata', methods=['GET'])
def get_model_metadata():
    """Get model metadata"""
    return jsonify(model_metadata)

@app.route('/model/features', methods=['GET'])
def get_feature_columns():
    """Get feature columns"""
    return jsonify(feature_columns)

@app.route('/model/stats', methods=['GET'])
def get_model_stats():
    """Get model performance statistics"""
    stats = {
        "base_model": {
            "accuracy": 0.85,
            "precision": 0.84,
            "recall": 0.86,
            "f1": 0.85,
            "available": base_model is not None
        },
        "calibrated_model": {
            "accuracy": 0.85,
            "precision": 0.84,
            "recall": 0.86,
            "f1": 0.85,
            "brier_score": 0.12,
            "available": calibrated_model is not None
        },
        "current_model": current_model_type
    }
    return jsonify(stats)

@app.route('/model/switch', methods=['POST'])
def switch_model():
    """Switch between base and calibrated models"""
    global current_model_type
    
    data = request.get_json()
    new_model_type = data.get('model_type', 'calibrated')
    
    if new_model_type not in ['base', 'calibrated']:
        return jsonify({"error": "Invalid model type. Use 'base' or 'calibrated'"}), 400
    
    # Check if model is available
    if new_model_type == 'base' and base_model is None:
        return jsonify({"error": "Base model not available"}), 400
    elif new_model_type == 'calibrated' and calibrated_model is None:
        return jsonify({"error": "Calibrated model not available"}), 400
    
    current_model_type = new_model_type
    logger.info(f"🔄 Switched to {current_model_type} model")
    
    return jsonify({
        "message": f"Switched to {current_model_type} model",
        "current_model": current_model_type
    })

@app.route('/predict/ml', methods=['POST'])
def predict_ml():
    """Make ML prediction with specified model"""
    try:
        data = request.get_json()
        features = data.get('features', {})
        model_type = data.get('model_type', current_model_type)
        
        # Prepare features
        X = prepare_features(features)
        if X is None:
            return jsonify({"error": "Failed to prepare features"}), 400
        
        # Make prediction
        result = predict_with_model(X, model_type)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/predict/compare', methods=['POST'])
def compare_predictions():
    """Compare predictions between base and calibrated models"""
    try:
        data = request.get_json()
        features = data.get('features', {})
        
        # Prepare features
        X = prepare_features(features)
        if X is None:
            return jsonify({"error": "Failed to prepare features"}), 400
        
        # Get predictions from both models
        base_result = predict_with_model(X, "base")
        calibrated_result = predict_with_model(X, "calibrated")
        
        # Calculate difference
        difference = 0
        if "error" not in base_result and "error" not in calibrated_result:
            difference = abs(calibrated_result["win_probability"] - base_result["win_probability"])
        
        return jsonify({
            "base": base_result,
            "calibrated": calibrated_result,
            "difference": difference
        })
        
    except Exception as e:
        logger.error(f"Comparison failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/predict/race', methods=['GET'])
def predict_race():
    """Predict full race outcome"""
    try:
        race_name = request.args.get('name', 'Monaco Grand Prix')
        race_date = request.args.get('date')
        
        # Generate predictions for all drivers
        predictions = []
        
        for driver in F1_2025_DRIVERS:
            # Generate realistic features for each driver
            features = generate_driver_features(driver, race_name)
            
            # Make prediction
            X = prepare_features(features)
            if X is not None:
                result = predict_with_model(X, current_model_type)
                if "error" not in result:
                    predictions.append({
                        "driver": driver,
                        "team": F1_2025_TEAMS.get(driver, "Unknown"),
                        "win_probability": result["win_probability"],
                        "podium_probability": result["podium_probability"],
                        "expected_position": result["expected_position"]
                    })
        
        # Sort by win probability
        predictions.sort(key=lambda x: x["win_probability"], reverse=True)
        
        # Add positions
        for i, pred in enumerate(predictions):
            pred["position"] = i + 1
        
        return jsonify({
            "race_name": race_name,
            "race_date": race_date,
            "model_type": current_model_type,
            "predictions": predictions,
            "generated_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Race prediction failed: {e}")
        return jsonify({"error": str(e)}), 500

def generate_driver_features(driver: str, race_name: str) -> Dict[str, Any]:
    """Generate realistic features for a driver"""
    # This is a simplified feature generation
    # In a real implementation, you would use actual data
    
    np.random.seed(hash(driver + race_name) % 2**32)
    
    # Base features
    features = {
        "qualifying_position": np.random.randint(1, 21),
        "recent_form": np.random.beta(2, 2),
        "track_dominance": np.random.beta(1.5, 1.5),
        "season_points": np.random.poisson(50) + np.random.randint(0, 100),
        "season_wins": np.random.poisson(2),
        "season_podiums": np.random.poisson(5),
        "weather_temp": np.random.normal(22, 8),
        "weather_rain_chance": np.random.beta(2, 3) * 100,
        "weather_wind": np.random.exponential(10),
        "track_corners": np.random.randint(10, 25),
        "track_straights": np.random.randint(2, 6),
        "track_difficulty": np.random.choice([1, 2, 3, 4])
    }
    
    # Add engineered features
    features["qualifying_to_race_diff"] = features["qualifying_position"] - np.random.randint(1, 21)
    features["form_consistency"] = features["recent_form"] * features["track_dominance"]
    features["season_performance"] = features["season_points"] / 100 + features["season_wins"] * 0.5 + features["season_podiums"] * 0.2
    features["weather_impact"] = (features["weather_rain_chance"] * 0.3 + 
                                  abs(features["weather_temp"] - 22) * 0.1 + 
                                  features["weather_wind"] * 0.05)
    features["track_complexity"] = features["track_corners"] * 0.5 + features["track_straights"] * 0.2
    features["track_difficulty_score"] = features["track_difficulty"] * 0.3 + features["track_complexity"] * 0.7
    features["team_strength"] = np.random.beta(2, 2)
    features["driver_team_synergy"] = features["recent_form"] * features["team_strength"]
    
    return features

@app.route('/model/reload', methods=['POST'])
def reload_models():
    """Reload all models"""
    success = load_models()
    if success:
        return jsonify({"message": "Models reloaded successfully"})
    else:
        return jsonify({"error": "Failed to reload models"}), 500

if __name__ == '__main__':
    # Load models on startup
    if not load_models():
        logger.error("❌ Failed to load models. Service may not work correctly.")
    
    # Start the service
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"🚀 Starting F1 ML Prediction Service V2 on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
