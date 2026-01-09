import json
import subprocess
import os
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

# Add the project root to the path so we can import our calibration modules
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from simple_calibration_service import calibration_pipeline, save_calibration_config, extract_calibration_params
from tune_calibration import tune_calibration
from .PredictionLogger import PredictionLogger

class AutoCalibrator:
    """
    Service for automatically updating calibration parameters based on new race results.
    """
    
    def __init__(self, 
                 predictions_log_file: str = "predictions_log.json",
                 results_file: str = "race_results.json",
                 calibration_config_path: str = "calibration_config.json"):
        self.predictions_log_file = predictions_log_file
        self.results_file = results_file
        self.calibration_config_path = calibration_config_path
        self.logger = PredictionLogger(predictions_log_file)
    
    def prepare_training_data(self) -> List[Dict]:
        """
        Prepare training data for calibration tuning by matching predictions to actual results.
        
        Returns:
            List of race data with predictions and actual results
        """
        predictions = self.logger.get_all_predictions()
        results = self.logger.get_all_results()
        
        training_data = []
        
        for result in results:
            race_name = result["race_name"]
            actual_winner = result["actual_results"][0] if result["actual_results"] else None
            
            if not actual_winner:
                continue
            
            # Find predictions for this race
            race_predictions = [p for p in predictions if p["race_name"] == race_name]
            
            if not race_predictions:
                continue
            
            # Use the most recent prediction for this race
            latest_prediction = max(race_predictions, key=lambda x: x["timestamp"])
            
            # Convert predictions to the format expected by tune_calibration.py
            formatted_predictions = []
            for pred in latest_prediction["predictions"]:
                formatted_predictions.append({
                    "driver": pred["driver"],
                    "team": pred["team"],
                    "win_probability": pred["win_probability"]
                })
            
            training_data.append({
                "race": race_name,
                "actual_winner": actual_winner,
                "predictions": formatted_predictions
            })
        
        return training_data
    
    def update_calibration(self, n_trials: int = 100, force_update: bool = False) -> bool:
        """
        Update calibration parameters based on new race results.
        
        Args:
            n_trials: Number of Optuna trials to run
            force_update: Force update even if no new results
            
        Returns:
            True if calibration was updated, False otherwise
        """
        print("🔄 Starting auto-calibration update...")
        
        # Check if we have enough data
        training_data = self.prepare_training_data()
        
        if len(training_data) < 3:
            print(f"⚠️  Not enough training data ({len(training_data)} races). Need at least 3 races.")
            return False
        
        # Check if we have new results since last calibration
        if not force_update and not self._has_new_results():
            print("ℹ️  No new race results since last calibration. Skipping update.")
            return False
        
        print(f"📊 Training calibration with {len(training_data)} races...")
        
        try:
            # Update the tune_calibration.py to use our training data
            self._update_tuning_script(training_data)
            
            # Run calibration tuning
            study, config = tune_calibration(n_trials=n_trials, config_path=self.calibration_config_path)
            
            # Save the new calibration config
            save_calibration_config(config, self.calibration_config_path)
            
            # Log the calibration update
            self._log_calibration_update(study, config)
            
            print(f"✅ Calibration updated successfully!")
            print(f"   - Best log loss: {study.best_value:.4f}")
            print(f"   - Trials completed: {len(study.trials)}")
            print(f"   - Config saved to: {self.calibration_config_path}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error updating calibration: {str(e)}")
            return False
    
    def _has_new_results(self) -> bool:
        """Check if there are new race results since last calibration."""
        try:
            # Check if calibration config exists
            if not os.path.exists(self.calibration_config_path):
                return True
            
            # Get last calibration time from config
            with open(self.calibration_config_path, 'r') as f:
                config = json.load(f)
            
            last_calibration = config.get("last_updated")
            if not last_calibration:
                return True
            
            # Get latest result time
            results = self.logger.get_all_results()
            if not results:
                return False
            
            latest_result = max(results, key=lambda x: x["timestamp"])
            latest_result_time = latest_result["timestamp"]
            
            return latest_result_time > last_calibration
            
        except Exception:
            return True
    
    def _update_tuning_script(self, training_data: List[Dict]):
        """Update the tune_calibration.py script to use our training data."""
        # This is a simplified approach - in production you might want to
        # modify the script more dynamically or pass data as parameters
        
        # For now, we'll create a temporary script with our data
        temp_script = """
import optuna
import numpy as np
import json
from typing import List, Dict
from simple_calibration_service import calibration_pipeline, save_calibration_config, extract_calibration_params

# Training data
TRAINING_DATA = {training_data}

def create_sample_historical_data() -> List[Dict]:
    return TRAINING_DATA

def calculate_log_loss(predictions: List[Dict], actual_winner: str) -> float:
    winner_prob = 0.0
    for pred in predictions:
        if pred["driver"] == actual_winner:
            winner_prob = pred["win_probability"]
            break
    
    epsilon = 1e-9
    log_loss = -np.log(winner_prob + epsilon)
    return log_loss

def objective(trial):
    # Generate team calibration parameters
    team_factors = {{}}
    for team in ["Red Bull", "McLaren", "Ferrari", "Mercedes", "Aston Martin", "Alpine", "Williams", "Visa Cash App RB", "Stake F1 Team", "Haas F1 Team"]:
        team_factors[team] = trial.suggest_float(f"team_{{team}}", 0.85, 1.15)
    
    # Generate driver calibration parameters  
    driver_factors = {{}}
    for driver in ["Max Verstappen", "Sergio Perez", "Lando Norris", "Oscar Piastri", "Charles Leclerc", "Carlos Sainz", "Lewis Hamilton", "George Russell", "Fernando Alonso", "Lance Stroll", "Esteban Ocon", "Pierre Gasly", "Alex Albon", "Logan Sargeant", "Daniel Ricciardo", "Yuki Tsunoda", "Valtteri Bottas", "Zhou Guanyu", "Nico Hulkenberg", "Kevin Magnussen"]:
        driver_factors[driver] = trial.suggest_float(f"driver_{{driver}}", 0.85, 1.15)
    
    # Load historical data
    historical_data = create_sample_historical_data()
    
    # Evaluate on historical races
    total_log_loss = 0.0
    num_races = len(historical_data)
    
    for race_data in historical_data:
        # Apply calibration pipeline with trial parameters
        calibrated_predictions = calibration_pipeline(
            race_data["predictions"],
            team_factors=team_factors,
            driver_factors=driver_factors
        )
        
        # Calculate log loss for this race
        race_log_loss = calculate_log_loss(
            calibrated_predictions, 
            race_data["actual_winner"]
        )
        
        total_log_loss += race_log_loss
    
    # Return average log loss
    return total_log_loss / num_races

if __name__ == "__main__":
    study = optuna.create_study(direction="minimize")
    study.optimize(objective, n_trials=100)
    
    best_params = study.best_params
    calibration_config = extract_calibration_params(best_params)
    calibration_config["last_updated"] = "{datetime.now().isoformat()}"
    
    save_calibration_config(calibration_config, "{self.calibration_config_path}")
    print("Calibration updated successfully!")
"""
        
        # Write temporary script
        with open("temp_tune_calibration.py", "w") as f:
            f.write(temp_script.format(
                training_data=json.dumps(training_data, indent=2),
                datetime=datetime,
                self=self
            ))
    
    def _log_calibration_update(self, study, config: Dict):
        """Log the calibration update for tracking."""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "best_log_loss": study.best_value,
            "trials_completed": len(study.trials),
            "best_trial_number": study.best_trial.number,
            "config_summary": {
                "team_factors_count": len(config.get("team_factors", {})),
                "driver_factors_count": len(config.get("driver_factors", {}))
            }
        }
        
        calibration_log_file = "calibration_update_log.json"
        try:
            with open(calibration_log_file, 'r') as f:
                log_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            log_data = []
        
        log_data.append(log_entry)
        
        with open(calibration_log_file, 'w') as f:
            json.dump(log_data, f, indent=2)
    
    def get_calibration_status(self) -> Dict:
        """Get current calibration status and statistics."""
        try:
            with open(self.calibration_config_path, 'r') as f:
                config = json.load(f)
        except FileNotFoundError:
            config = {}
        
        training_data = self.prepare_training_data()
        
        return {
            "last_updated": config.get("last_updated"),
            "training_races_count": len(training_data),
            "team_factors_count": len(config.get("team_factors", {})),
            "driver_factors_count": len(config.get("driver_factors", {})),
            "has_new_results": self._has_new_results()
        }
    
    def schedule_weekly_update(self):
        """Schedule weekly calibration updates (for cron job usage)."""
        print("🔄 Running scheduled weekly calibration update...")
        return self.update_calibration(n_trials=200, force_update=True)
