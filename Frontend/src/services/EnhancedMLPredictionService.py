import json
import os
import sys
from typing import Dict, List, Any, Optional
from pathlib import Path

# Add the project root to the path so we can import our calibration modules
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from simple_calibration_service import calibration_pipeline
from .PredictionLogger import PredictionLogger
from .EnhancedAutoCalibrator import EnhancedAutoCalibrator

class EnhancedMLPredictionService:
    """
    Enhanced ML Prediction Service with circuit and condition-aware calibration.
    """
    
    def __init__(self, 
                 model=None, 
                 calibration_config_path: str = "enhanced_calibration_config.json",
                 enable_logging: bool = True,
                 model_version: str = "v2.0",
                 use_enhanced_calibration: bool = True):
        self.model = model
        self.calibration_config_path = calibration_config_path
        self.enable_logging = enable_logging
        self.model_version = model_version
        self.use_enhanced_calibration = use_enhanced_calibration
        
        if enable_logging:
            self.logger = PredictionLogger()
        else:
            self.logger = None
        
        if use_enhanced_calibration:
            self.enhanced_calibrator = EnhancedAutoCalibrator(
                calibration_config_path=calibration_config_path
            )
        else:
            self.enhanced_calibrator = None
    
    def predict(self, race_features: Dict[str, Any], race_name: str = None) -> List[Dict[str, Any]]:
        """
        Generate predictions for a race with enhanced calibration.
        
        Args:
            race_features: Features for the race prediction (including circuit and conditions)
            race_name: Name of the race (for logging)
            
        Returns:
            List of calibrated driver predictions
        """
        # Step 1: Generate raw predictions from ML model
        raw_predictions = self._generate_raw_predictions(race_features)
        
        # Step 2: Apply enhanced calibration if enabled
        if self.use_enhanced_calibration and self.enhanced_calibrator:
            calibrated_predictions = self._apply_enhanced_calibration(raw_predictions, race_features)
        else:
            # Fall back to basic calibration
            calibrated_predictions = calibration_pipeline(
                raw_predictions, 
                config_path=self.calibration_config_path
            )
        
        # Step 3: Log predictions if enabled
        if self.enable_logging and race_name and self.logger:
            self.logger.log_prediction(
                race_name=race_name,
                predictions=calibrated_predictions,
                model_version=self.model_version,
                additional_metadata={
                    "race_features": race_features,
                    "calibration_applied": True,
                    "enhanced_calibration": self.use_enhanced_calibration
                }
            )
        
        return calibrated_predictions
    
    def _apply_enhanced_calibration(self, predictions: List[Dict], race_features: Dict[str, Any]) -> List[Dict]:
        """
        Apply enhanced calibration with circuit and condition awareness.
        
        Args:
            predictions: Raw predictions from ML model
            race_features: Race features including circuit and conditions
            
        Returns:
            Enhanced calibrated predictions
        """
        # Extract circuit and conditions from race features
        circuit = race_features.get("circuit", "unknown")
        conditions = {
            "weather": race_features.get("weather", "dry"),
            "tires": race_features.get("tires", "medium"),
            "safety_car_prob": race_features.get("safety_car_prob", 0.0),
            "temperature": race_features.get("temperature", 20)
        }
        
        # Apply enhanced calibration
        calibrated_predictions = self.enhanced_calibrator.apply_enhanced_calibration(
            predictions, circuit, conditions
        )
        
        return calibrated_predictions
    
    def _generate_raw_predictions(self, race_features: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate raw predictions from the ML model.
        
        Args:
            race_features: Features for the race prediction
            
        Returns:
            List of raw driver predictions
        """
        if self.model is None:
            # Mock predictions for testing - replace with actual model
            return self._generate_mock_predictions()
        
        try:
            # Convert features to model input format
            model_input = self._prepare_model_input(race_features)
            
            # Get raw probabilities from model
            raw_probs = self.model.predict_proba(model_input)
            
            # Convert to driver predictions format
            predictions = []
            for i, driver in enumerate(self.model.classes_):
                predictions.append({
                    "driver": driver,
                    "team": self._get_driver_team(driver),
                    "win_probability": float(raw_probs[0][i])
                })
            
            return predictions
            
        except Exception as e:
            print(f"⚠️  Error generating raw predictions: {str(e)}")
            print("   Falling back to mock predictions...")
            return self._generate_mock_predictions()
    
    def _generate_mock_predictions(self) -> List[Dict[str, Any]]:
        """Generate mock predictions for testing purposes."""
        mock_predictions = [
            {"driver": "Max Verstappen", "team": "Red Bull Racing", "win_probability": 0.35},
            {"driver": "Lando Norris", "team": "McLaren", "win_probability": 0.25},
            {"driver": "Charles Leclerc", "team": "Ferrari", "win_probability": 0.20},
            {"driver": "Oscar Piastri", "team": "McLaren", "win_probability": 0.15},
            {"driver": "Lewis Hamilton", "team": "Ferrari", "win_probability": 0.05}
        ]
        return mock_predictions
    
    def _prepare_model_input(self, race_features: Dict[str, Any]) -> Any:
        """
        Prepare race features for model input.
        
        Args:
            race_features: Raw race features
            
        Returns:
            Model input format
        """
        # This is a placeholder - implement based on your actual model
        # You might need to:
        # - Convert to numpy array
        # - Apply feature scaling
        # - Reshape for your model
        return race_features
    
    def _get_driver_team(self, driver_name: str) -> str:
        """Get team name for a driver."""
        driver_teams = {
    "Max Verstappen": "Red Bull Racing",
    "Yuki Tsunoda": "Red Bull Racing",

    "Charles Leclerc": "Ferrari",
    "Lewis Hamilton": "Ferrari",

    "George Russell": "Mercedes",
    "Andrea Kimi Antonelli": "Mercedes",

    "Lando Norris": "McLaren",
    "Oscar Piastri": "McLaren",

    "Fernando Alonso": "Aston Martin",
    "Lance Stroll": "Aston Martin",

    "Pierre Gasly": "Alpine",
    "Franco Colapinto": "Alpine",

    "Esteban Ocon": "Haas",
    "Oliver Bearman": "Haas",

    "Liam Lawson": "Racing Bulls",
    "Isack Hadjar": "Racing Bulls",

    "Alexander Albon": "Williams",
    "Carlos Sainz": "Williams",

    "Nico Hulkenberg": "Kick Sauber",
    "Gabriel Bortoleto": "Kick Sauber"
}

        return driver_teams.get(driver_name, "Unknown")
    
    def predict_with_enhanced_metadata(self, race_features: Dict[str, Any], race_name: str = None) -> Dict[str, Any]:
        """
        Generate predictions with enhanced metadata including calibration factors.
        
        Args:
            race_features: Features for the race prediction
            race_name: Name of the race
            
        Returns:
            Dictionary with predictions and enhanced metadata
        """
        predictions = self.predict(race_features, race_name)
        
        # Extract calibration factors if available
        calibration_factors = {}
        if predictions and "calibration_factors" in predictions[0]:
            calibration_factors = predictions[0]["calibration_factors"]
        
        return {
            "race_name": race_name,
            "predictions": predictions,
            "model_version": self.model_version,
            "calibration_applied": True,
            "enhanced_calibration": self.use_enhanced_calibration,
            "timestamp": self._get_current_timestamp(),
            "metadata": {
                "total_probability": sum(p["win_probability"] for p in predictions),
                "prediction_count": len(predictions),
                "top_prediction": predictions[0] if predictions else None,
                "circuit": race_features.get("circuit", "unknown"),
                "conditions": {
                    "weather": race_features.get("weather", "dry"),
                    "tires": race_features.get("tires", "medium"),
                    "safety_car_prob": race_features.get("safety_car_prob", 0.0),
                    "temperature": race_features.get("temperature", 20)
                },
                "calibration_factors": calibration_factors
            }
        }
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def get_prediction_history(self, race_name: str = None) -> List[Dict]:
        """Get prediction history for a specific race or all races."""
        if not self.logger:
            return []
        
        if race_name:
            return self.logger.get_predictions_for_race(race_name)
        else:
            return self.logger.get_all_predictions()
    
    def log_race_result(self, race_name: str, actual_results: List[str], 
                       race_date: str = None, additional_metadata: Dict = None):
        """Log actual race results for calibration training."""
        if self.logger:
            self.logger.log_race_result(
                race_name=race_name,
                actual_results=actual_results,
                race_date=race_date,
                additional_metadata=additional_metadata
            )
    
    def get_enhanced_calibration_status(self) -> Dict[str, Any]:
        """Get enhanced calibration status."""
        if self.enhanced_calibrator:
            return self.enhanced_calibrator.get_enhanced_calibration_status()
        else:
            return {
                "enhanced_calibration": False,
                "error": "Enhanced calibrator not initialized"
            }
    
    def update_enhanced_calibration(self, n_trials: int = 100, force_update: bool = False) -> bool:
        """Update enhanced calibration parameters."""
        if self.enhanced_calibrator:
            return self.enhanced_calibrator.update_enhanced_calibration(n_trials, force_update)
        else:
            print("❌ Enhanced calibrator not initialized")
            return False
    
    def reload_calibration(self):
        """Reload calibration parameters from config file."""
        try:
            if self.enhanced_calibrator:
                self.enhanced_calibrator.load_config()
                print("✅ Enhanced calibration config reloaded successfully")
                return True
            else:
                print("⚠️  Enhanced calibrator not initialized")
                return False
        except Exception as e:
            print(f"❌ Error reloading calibration: {str(e)}")
            return False
    
    def get_calibration_insights(self, race_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get insights about how calibration factors affect predictions.
        
        Args:
            race_features: Race features to analyze
            
        Returns:
            Dictionary with calibration insights
        """
        if not self.enhanced_calibrator:
            return {"error": "Enhanced calibrator not available"}
        
        circuit = race_features.get("circuit", "unknown")
        conditions = {
            "weather": race_features.get("weather", "dry"),
            "tires": race_features.get("tires", "medium"),
            "safety_car_prob": race_features.get("safety_car_prob", 0.0),
            "temperature": race_features.get("temperature", 20)
        }
        
        # Get condition modifiers
        condition_modifiers = self.enhanced_calibrator._get_condition_modifiers(conditions)
        
        # Get circuit factors
        circuit_factors = self.enhanced_calibrator.circuit_factors.get(circuit, {})
        
        # Get global factors
        global_driver_factors = self.enhanced_calibrator.global_factors.get("driver_factors", {})
        global_team_factors = self.enhanced_calibrator.global_factors.get("team_factors", {})
        
        return {
            "circuit": circuit,
            "conditions": conditions,
            "condition_modifiers": condition_modifiers,
            "circuit_factors": circuit_factors,
            "global_driver_factors": global_driver_factors,
            "global_team_factors": global_team_factors,
            "analysis": {
                "circuit_specific": len(circuit_factors) > 0,
                "condition_specific": len(condition_modifiers) > 0,
                "weather_impact": conditions["weather"] != "dry",
                "safety_car_impact": conditions["safety_car_prob"] > 0.3
            }
        }





