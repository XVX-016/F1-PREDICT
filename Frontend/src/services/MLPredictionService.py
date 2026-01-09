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

class MLPredictionService:
    """
    ML Prediction Service with integrated calibration and logging.
    """
    
    def __init__(self, 
                 model=None, 
                 calibration_config_path: str = "calibration_config.json",
                 enable_logging: bool = True,
                 model_version: str = "v1.0"):
        self.model = model
        self.calibration_config_path = calibration_config_path
        self.enable_logging = enable_logging
        self.model_version = model_version
        
        if enable_logging:
            self.logger = PredictionLogger()
        else:
            self.logger = None
    
    def predict(self, race_features: Dict[str, Any], race_name: str = None) -> List[Dict[str, Any]]:
        """
        Generate predictions for a race with automatic calibration.
        
        Args:
            race_features: Features for the race prediction
            race_name: Name of the race (for logging)
            
        Returns:
            List of calibrated driver predictions
        """
        # Step 1: Generate raw predictions from ML model
        raw_predictions = self._generate_raw_predictions(race_features)
        
        # Step 2: Apply calibration
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
                    "calibration_applied": True
                }
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
    
    def predict_with_metadata(self, race_features: Dict[str, Any], race_name: str = None) -> Dict[str, Any]:
        """
        Generate predictions with additional metadata.
        
        Args:
            race_features: Features for the race prediction
            race_name: Name of the race
            
        Returns:
            Dictionary with predictions and metadata
        """
        predictions = self.predict(race_features, race_name)
        
        return {
            "race_name": race_name,
            "predictions": predictions,
            "model_version": self.model_version,
            "calibration_applied": True,
            "timestamp": self._get_current_timestamp(),
            "metadata": {
                "total_probability": sum(p["win_probability"] for p in predictions),
                "prediction_count": len(predictions),
                "top_prediction": predictions[0] if predictions else None
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
    
    def get_calibration_status(self) -> Dict[str, Any]:
        """Get current calibration status."""
        try:
            with open(self.calibration_config_path, 'r') as f:
                config = json.load(f)
            
            return {
                "calibration_loaded": True,
                "last_updated": config.get("last_updated"),
                "team_factors_count": len(config.get("team_factors", {})),
                "driver_factors_count": len(config.get("driver_factors", {})),
                "config_path": self.calibration_config_path
            }
        except FileNotFoundError:
            return {
                "calibration_loaded": False,
                "error": "Calibration config not found"
            }
        except Exception as e:
            return {
                "calibration_loaded": False,
                "error": str(e)
            }
    
    def reload_calibration(self):
        """Reload calibration parameters from config file."""
        try:
            # The calibration_pipeline function will automatically reload
            # the config when called, so we just need to verify it exists
            if os.path.exists(self.calibration_config_path):
                print("✅ Calibration config reloaded successfully")
                return True
            else:
                print("⚠️  Calibration config file not found")
                return False
        except Exception as e:
            print(f"❌ Error reloading calibration: {str(e)}")
            return False
