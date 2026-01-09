import os
import sys
import pandas as pd
import numpy as np
import joblib
import json
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import logging
from pathlib import Path

# Add backend to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLPredictionService:
    """
    Enhanced ML-based F1 Prediction Service that uses:
    1. Base model (v1) for raw predictions
    2. Calibrated model (v2) for calibrated outputs
    3. Track features database for weather/environmental factors
    4. Config-based driver calibration system
    5. Integration with existing calibration system
    """
    
    def __init__(self):
        self.base_model = None
        self.calibrated_model = None
        self.scaler = None
        self.feature_columns = None
        self.models_loaded = False
        
        # Load models
        self._load_models()
        
        # Load track features database
        self._load_track_features()
        
        # Load driver calibration from config
        self._load_driver_calibration()
        
        # Track-specific calibration factors (from existing system)
        self.track_calibration = {
            "Monaco": {
                "Ferrari": 1.15,  # Ferrari typically strong at Monaco
                "Red Bull Racing": 1.1,
                "McLaren": 0.95,
                "Mercedes": 0.9
            },
            "Monza": {
                "Ferrari": 1.2,   # Ferrari home advantage
                "Red Bull Racing": 1.1,
                "McLaren": 1.05,
                "Mercedes": 1.0
            },
            "Silverstone": {
                "McLaren": 1.15,  # McLaren home advantage
                "Red Bull Racing": 1.1,
                "Ferrari": 1.0,
                "Mercedes": 1.05
            },
            "Spa": {
                "Red Bull Racing": 1.15,  # Red Bull strong at Spa
                "Ferrari": 1.05,
                "McLaren": 1.0,
                "Mercedes": 0.95
            }
        }
    
    def _load_track_features(self):
        """Load track features database"""
        try:
            # Import track features database
            sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            from track_features_database import track_features_db
            self.track_features_db = track_features_db
            logger.info("✅ Track features database loaded successfully")
        except Exception as e:
            logger.warning(f"⚠️ Track features database not available: {e}")
            self.track_features_db = None
    
    def _load_driver_calibration(self):
        """Load driver calibration from config file"""
        try:
            config_path = Path("driver_calibration.json")
            if config_path.exists():
                with open(config_path, 'r') as f:
                    config = json.load(f)
                
                # Extract calibration factors
                self.driver_calibration = {}
                for driver, data in config["calibration_factors"].items():
                    self.driver_calibration[driver] = data["factor"]
                
                logger.info(f"✅ Driver calibration loaded from config: {len(self.driver_calibration)} drivers")
                logger.info(f"  Config version: {config.get('version', 'N/A')}")
            else:
                logger.warning("⚠️ Driver calibration config not found, using defaults")
                self._load_default_driver_calibration()
                
        except Exception as e:
            logger.warning(f"⚠️ Failed to load driver calibration config: {e}")
            self._load_default_driver_calibration()
    
    def _load_default_driver_calibration(self):
        """Load default driver calibration factors"""
        self.driver_calibration = {
            "Max Verstappen": 1.2,      # Current dominant driver
            "Sergio Pérez": 0.95,       # Experienced but inconsistent
            "Lewis Hamilton": 1.0,      # Experienced
            "George Russell": 0.95,     # Good but not peak
            "Charles Leclerc": 1.1,     # Strong qualifier
            "Carlos Sainz": 0.95,       # Consistent
            "Lando Norris": 1.05,       # Rising star
            "Oscar Piastri": 0.9,       # Young talent
            "Fernando Alonso": 1.0,     # Experienced
            "Lance Stroll": 0.85,       # Inconsistent
            "Esteban Ocon": 0.9,        # Midfield
            "Pierre Gasly": 0.9,        # Midfield
            "Alexander Albon": 0.9,     # Good qualifier
            "Logan Sargeant": 0.8,      # Developing
            "Valtteri Bottas": 0.9,     # Experienced
            "Zhou Guanyu": 0.85,        # Midfield
            "Nico Hulkenberg": 0.85,    # Experienced midfield
            "Kevin Magnussen": 0.85,    # Experienced midfield
            "Daniel Ricciardo": 0.9,    # Experienced
            "Yuki Tsunoda": 0.85        # Developing
        }
    
    def _load_models(self):
        """Load the trained ML models"""
        try:
            model_dir = Path("model")
            
            # Load base model (v1)
            base_model_path = model_dir / "base_model.joblib"
            if base_model_path.exists():
                self.base_model = joblib.load(base_model_path)
                logger.info("✅ Base model (v1) loaded successfully")
            else:
                logger.warning("⚠️ Base model not found")
                return
            
            # Load calibrated model (v2)
            calibrated_model_path = model_dir / "calibrated_model.joblib"
            if calibrated_model_path.exists():
                self.calibrated_model = joblib.load(calibrated_model_path)
                logger.info("✅ Calibrated model (v2) loaded successfully")
            else:
                logger.warning("⚠️ Calibrated model not found")
                return
            
            # Load scaler
            scaler_path = model_dir / "scaler.joblib"
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                logger.info("✅ Scaler loaded successfully")
            else:
                logger.warning("⚠️ Scaler not found")
                return
            
            # Load feature columns
            feature_columns_path = model_dir / "feature_columns.json"
            if feature_columns_path.exists():
                with open(feature_columns_path, 'r') as f:
                    self.feature_columns = json.load(f)
                logger.info("✅ Feature columns loaded successfully")
            else:
                logger.warning("⚠️ Feature columns not found")
                return
            
            self.models_loaded = True
            logger.info("✅ All ML models loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to load ML models: {e}")
            self.models_loaded = False
    
    def get_race_predictions(self, circuit: str, season: int = 2025, date: str = None, 
                           drivers: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Get comprehensive race predictions using ML models + calibration + track features
        
        Args:
            circuit: Circuit name (e.g., "Monza", "Silverstone")
            season: F1 season year
            date: Race date (optional, for historical predictions)
            drivers: List of drivers with team info
            
        Returns:
            Dictionary with predictions, metadata, and model info
        """
        try:
            if not self.models_loaded:
                logger.error("ML models not loaded")
                return self._get_fallback_predictions(circuit)
            
            if not drivers:
                logger.error("No drivers provided")
                return self._get_fallback_predictions(circuit)
            
            logger.info(f"Generating ML predictions for {circuit} {season}")
            
            # 1. Get track analysis including weather and environmental factors
            track_analysis = self._get_track_analysis(circuit, date)
            
            # 2. Generate ML predictions
            ml_predictions = self._generate_ml_predictions(circuit, drivers)
            
            # 3. Apply calibration adjustments including track features
            calibrated_predictions = self._apply_enhanced_calibration(
                drivers, ml_predictions, circuit, track_analysis
            )
            
            # 4. Get next race info for context
            next_race = self._get_next_race_info(season)
            
            return {
                "status": "success",
                "race": {
                    "circuit": circuit,
                    "season": season,
                    "date": date,
                    "next_race": next_race
                },
                "predictions": calibrated_predictions,
                "ml_predictions": ml_predictions,
                "track_analysis": track_analysis,
                "metadata": {
                    "ml_model_used": True,
                    "base_model_version": "v1.0",
                    "calibrated_model_version": "v2.0",
                    "calibration_applied": True,
                    "track_features_included": True,
                    "weather_factors_included": True,
                    "total_drivers": len(drivers),
                    "prediction_timestamp": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"ML prediction failed for {circuit}: {e}")
            return self._get_fallback_predictions(circuit)
    
    def _get_track_analysis(self, circuit: str, date: str = None) -> Dict[str, Any]:
        """Get comprehensive track analysis including weather and environmental factors"""
        if self.track_features_db:
            try:
                analysis = self.track_features_db.get_comprehensive_track_analysis(circuit, date)
                logger.info(f"✅ Track analysis loaded for {circuit}")
                return analysis
            except Exception as e:
                logger.warning(f"⚠️ Track analysis failed for {circuit}: {e}")
        
        # Fallback track analysis
        return {
            "circuit": circuit,
            "track_features": {},
            "weather_impact": {
                "temperature_factor": 1.0,
                "humidity_factor": 1.0,
                "wind_factor": 1.0,
                "precipitation_factor": 1.0,
                "visibility_factor": 1.0,
                "air_density_factor": 1.0
            },
            "performance_factors": {
                "grip_factor": 1.0,
                "tire_wear_factor": 1.0,
                "brake_wear_factor": 1.0,
                "downforce_factor": 1.0
            },
            "overall_factor": 1.0
        }
    
    def _generate_ml_predictions(self, circuit: str, drivers: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Generate predictions using the ML models"""
        try:
            # Prepare features for each driver
            features_list = []
            for driver in drivers:
                features = self._build_ml_features(driver["name"], driver["team"], circuit)
                features_list.append(features)
            
            # Convert to feature matrix
            X = pd.DataFrame(features_list, columns=self.feature_columns)
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Get base model predictions (v1)
            base_probs = self.base_model.predict_proba(X_scaled)[:, 1]
            
            # Get calibrated model predictions (v2)
            calibrated_probs = self.calibrated_model.predict_proba(X_scaled)[:, 1]
            
            # Return results
            results = []
            for i, driver in enumerate(drivers):
                results.append({
                    "driver": driver["name"],
                    "team": driver["team"],
                    "base_probability": float(base_probs[i]),
                    "calibrated_probability": float(calibrated_probs[i]),
                    "features": features_list[i]
                })
            
            return results
            
        except Exception as e:
            logger.error(f"ML prediction generation failed: {e}")
            return None
    
    def _build_ml_features(self, driver_name: str, team_name: str, circuit: str) -> List[float]:
        """Build feature vector for ML model prediction"""
        try:
            # Initialize feature vector with zeros
            features = [0.0] * len(self.feature_columns)
            
            # Map features to their expected positions
            feature_map = {}
            for i, col in enumerate(self.feature_columns):
                feature_map[col] = i
            
            # Set basic features
            if 'session_importance' in feature_map:
                features[feature_map['session_importance']] = 1.0  # Race session
            
            # Set driver and team performance features (simplified)
            if 'driver_avg_position' in feature_map:
                # Simplified driver performance based on name
                if "Verstappen" in driver_name:
                    features[feature_map['driver_avg_position']] = 2.0
                elif "Norris" in driver_name:
                    features[feature_map['driver_avg_position']] = 4.0
                elif "Leclerc" in driver_name:
                    features[feature_map['driver_avg_position']] = 3.5
                else:
                    features[feature_map['driver_avg_position']] = 8.0
            
            if 'team_avg_position' in feature_map:
                # Simplified team performance
                if "Red Bull" in team_name:
                    features[feature_map['team_avg_position']] = 2.5
                elif "McLaren" in team_name:
                    features[feature_map['team_avg_position']] = 4.0
                elif "Ferrari" in team_name:
                    features[feature_map['team_avg_position']] = 3.5
                else:
                    features[feature_map['team_avg_position']] = 7.0
            
            # Set other features to reasonable defaults
            for i, feature in enumerate(features):
                if feature == 0.0:
                    features[i] = 0.5  # Default value
            
            return features
            
        except Exception as e:
            logger.error(f"Feature building failed: {e}")
            return [0.5] * len(self.feature_columns)
    
    def _apply_enhanced_calibration(self, drivers: List[Dict], ml_predictions: List[Dict], 
                                  circuit: str, track_analysis: Dict[str, Any]) -> List[Dict]:
        """Apply enhanced calibration including track features and weather factors"""
        calibrated = []
        
        # Extract track factors
        weather_impact = track_analysis.get("weather_impact", {})
        performance_factors = track_analysis.get("performance_factors", {})
        overall_track_factor = track_analysis.get("overall_factor", 1.0)
        
        for i, driver in enumerate(drivers):
            driver_name = driver["name"]
            team_name = driver["team"]
            
            # Get ML probability
            if ml_predictions and i < len(ml_predictions):
                base_prob = ml_predictions[i]["base_probability"]
                calibrated_prob = ml_predictions[i]["calibrated_probability"]
            else:
                base_prob = 0.05  # Default probability
                calibrated_prob = 0.05
            
            # Apply track-specific calibration
            track_factor = self.track_calibration.get(circuit, {}).get(team_name, 1.0)
            
            # Apply driver-specific calibration
            driver_factor = self.driver_calibration.get(driver_name, 1.0)
            
            # Apply weather and environmental factors
            weather_factor = self._calculate_weather_factor(weather_impact)
            performance_factor = self._calculate_performance_factor(performance_factors)
            
            # Calculate final probability with all factors
            final_prob = calibrated_prob * track_factor * driver_factor * weather_factor * performance_factor * overall_track_factor
            
            calibrated.append({
                "driver": driver_name,
                "team": team_name,
                "base_probability": float(base_prob),
                "calibrated_probability": float(calibrated_prob),
                "final_probability": float(final_prob),
                "win_probability": float(final_prob),
                "podium_probability": float(self._win_to_podium_probability(final_prob)),
                "calibration_factors": {
                    "track_factor": track_factor,
                    "driver_factor": driver_factor,
                    "weather_factor": weather_factor,
                    "performance_factor": performance_factor,
                    "overall_track_factor": overall_track_factor,
                    "ml_calibration": calibrated_prob / base_prob if base_prob > 0 else 1.0
                },
                "track_analysis": {
                    "weather_impact": weather_impact,
                    "performance_factors": performance_factors,
                    "overall_factor": overall_track_factor
                }
            })
        
        # Normalize probabilities to sum to 1
        total_prob = sum(p["win_probability"] for p in calibrated)
        if total_prob > 0:
            for p in calibrated:
                p["win_probability"] = p["win_probability"] / total_prob
                p["podium_probability"] = p["podium_probability"] / total_prob
        
        # Sort by win probability (descending)
        calibrated.sort(key=lambda x: x["win_probability"], reverse=True)
        
        return calibrated
    
    def _calculate_weather_factor(self, weather_impact: Dict[str, float]) -> float:
        """Calculate combined weather factor"""
        if not weather_impact:
            return 1.0
        
        # Weighted average of weather factors
        factors = list(weather_impact.values())
        weights = [0.25, 0.20, 0.20, 0.15, 0.10, 0.10]  # Temperature, humidity, wind, precip, visibility, air density
        
        # Ensure we have enough weights
        while len(weights) < len(factors):
            weights.append(weights[-1])
        
        # Calculate weighted average
        total_weight = sum(weights[:len(factors)])
        weather_factor = sum(f * w for f, w in zip(factors, weights[:len(factors)])) / total_weight
        
        return round(weather_factor, 3)
    
    def _calculate_performance_factor(self, performance_factors: Dict[str, float]) -> float:
        """Calculate combined performance factor"""
        if not performance_factors:
            return 1.0
        
        # Weighted average of performance factors
        factors = list(performance_factors.values())
        weights = [0.30, 0.25, 0.25, 0.20]  # Grip, tire wear, brake wear, downforce
        
        # Ensure we have enough weights
        while len(weights) < len(factors):
            weights.append(weights[-1])
        
        # Calculate weighted average
        total_weight = sum(weights[:len(factors)])
        performance_factor = sum(f * w for f, w in zip(factors, weights[:len(factors)])) / total_weight
        
        return round(performance_factor, 3)
    
    def _apply_calibration(self, drivers: List[Dict], ml_predictions: List[Dict], 
                          circuit: str) -> List[Dict]:
        """Legacy calibration method for backward compatibility"""
        # Get track analysis
        track_analysis = self._get_track_analysis(circuit)
        
        # Use enhanced calibration
        return self._apply_enhanced_calibration(drivers, ml_predictions, circuit, track_analysis)
    
    def _win_to_podium_probability(self, win_prob: float) -> float:
        """Convert win probability to podium probability"""
        # Podium is roughly 3x more likely than winning
        return min(win_prob * 3, 0.95)
    
    def _get_next_race_info(self, season: int) -> Dict[str, Any]:
        """Get next race information"""
        # Simplified next race info
        return {
            "season": season,
            "next_race": "TBD",
            "next_race_date": "TBD"
        }
    
    def _get_fallback_predictions(self, circuit: str) -> Dict[str, Any]:
        """Fallback predictions when ML models are unavailable"""
        fallback_drivers = [
            {"name": "Max Verstappen", "team": "Red Bull Racing"},
            {"name": "Charles Leclerc", "team": "Ferrari"},
            {"name": "Lando Norris", "team": "McLaren"},
            {"name": "Lewis Hamilton", "team": "Ferrari"},
            {"name": "George Russell", "team": "Mercedes"}
        ]
        
        return {
            "status": "fallback",
            "race": {"circuit": circuit, "season": 2025},
            "predictions": self._apply_calibration(fallback_drivers, None, circuit),
            "ml_predictions": None,
            "track_analysis": self._get_track_analysis(circuit),
            "metadata": {
                "ml_model_used": False,
                "base_model_version": "N/A",
                "calibrated_model_version": "N/A",
                "calibration_applied": True,
                "track_features_included": True,
                "weather_factors_included": True,
                "total_drivers": len(fallback_drivers)
            }
        }
    
    def retrain_models(self) -> bool:
        """Trigger model retraining"""
        try:
            logger.info("Triggering model retraining...")
            
            # Run the training script
            import subprocess
            result = subprocess.run(
                ["python", "train_f1_model.py"],
                capture_output=True,
                text=True,
                timeout=600  # 10 minutes timeout
            )
            
            if result.returncode == 0:
                logger.info("Model retraining completed successfully")
                # Reload models
                self._load_models()
                return True
            else:
                logger.error(f"Model retraining failed: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to trigger model retraining: {e}")
            return False
    
    def get_track_features_summary(self, circuit: str) -> Dict[str, Any]:
        """Get summary of track features for a specific circuit"""
        if self.track_features_db:
            try:
                track_data = self.track_features_db.get_track_features(circuit)
                weather_impact = self.track_features_db.get_weather_impact(circuit)
                performance_factors = self.track_features_db.get_track_performance_factors(circuit)
                
                return {
                    "circuit": circuit,
                    "track_info": {
                        "name": track_data.get("circuit_name", circuit),
                        "location": track_data.get("location", "Unknown"),
                        "climate": track_data.get("climate", "Unknown")
                    },
                    "weather_summary": {
                        "temperature_range": track_data.get("typical_weather", {}).get("temperature_range", "N/A"),
                        "humidity_range": track_data.get("typical_weather", {}).get("humidity_range", "N/A"),
                        "wind_speed_range": track_data.get("typical_weather", {}).get("wind_speed_range", "N/A"),
                        "precipitation_chance": track_data.get("typical_weather", {}).get("precipitation_chance", "N/A")
                    },
                    "performance_summary": {
                        "grip_level": track_data.get("track_characteristics", {}).get("grip_level", "N/A"),
                        "tire_wear": track_data.get("track_characteristics", {}).get("tire_wear", "N/A"),
                        "downforce_importance": track_data.get("track_characteristics", {}).get("downforce_importance", "N/A")
                    },
                    "weather_impact": weather_impact,
                    "performance_factors": performance_factors
                }
            except Exception as e:
                logger.warning(f"Failed to get track features for {circuit}: {e}")
        
        return {"circuit": circuit, "error": "Track features not available"}

# Global instance
ml_prediction_service = MLPredictionService()
