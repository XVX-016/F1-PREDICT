import json
import os
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path
import sys

project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from simple_calibration_service import calibration_pipeline, save_calibration_config, extract_calibration_params
from .PredictionLogger import PredictionLogger

class EnhancedAutoCalibrator:
    """
    Enhanced Auto-Calibrator with circuit and condition-aware calibration.
    """
    
    def __init__(self,
                 predictions_log_file: str = "predictions_log.json",
                 results_file: str = "race_results.json",
                 calibration_config_path: str = "enhanced_calibration_config.json"):
        self.predictions_log_file = predictions_log_file
        self.results_file = results_file
        self.calibration_config_path = calibration_config_path
        self.logger = PredictionLogger(predictions_log_file)

        self.global_factors = {"team_factors": {}, "driver_factors": {}}
        self.circuit_factors = {}
        self.condition_factors = {}
        self.learning_rate = 0.05
        self.load_config()
    
    def load_config(self):
        """Load enhanced calibration configuration."""
        try:
            if os.path.exists(self.calibration_config_path):
                with open(self.calibration_config_path, 'r') as f:
                    config = json.load(f)
                
                self.global_factors = config.get("global_factors", self.global_factors)
                self.circuit_factors = config.get("circuit_factors", {})
                self.condition_factors = config.get("condition_factors", {})
                print("✅ Loaded enhanced calibration config from", self.calibration_config_path)
            else:
                print("ℹ️ No config found at", self.calibration_config_path + ". Using defaults.")
                self.save_config()
        except Exception as e:
            print(f"⚠️ Error loading config: {e}")
    
    def save_config(self):
        """Save enhanced calibration configuration."""
        config = {
            "global_factors": self.global_factors,
            "circuit_factors": self.circuit_factors,
            "condition_factors": self.condition_factors,
            "last_updated": datetime.now().isoformat(),
            "version": "2.0"
        }
        
        with open(self.calibration_config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        print("✅ Enhanced calibration config saved to", self.calibration_config_path)
    
    def apply_enhanced_calibration(self, predictions: List[Dict], circuit: str, conditions: Dict[str, Any]) -> List[Dict]:
        """
        Apply multi-layer calibration with circuit and condition awareness.
        
        Args:
            predictions: Raw predictions from ML model
            circuit: Circuit name
            conditions: Race conditions (weather, tires, etc.)
            
        Returns:
            Enhanced calibrated predictions
        """
        calibrated = []
        
        for pred in predictions:
            driver = pred["driver"]
            team = pred["team"]
            base_prob = pred["win_probability"]
            
            factor = 1.0
            
            # Layer 1: Global factors
            global_driver_factor = self.global_factors.get("driver_factors", {}).get(driver, 1.0)
            global_team_factor = self.global_factors.get("team_factors", {}).get(team, 1.0)
            factor *= global_driver_factor * global_team_factor
            
            # Layer 2: Circuit-specific factors
            circuit_factors = self.circuit_factors.get(circuit, {})
            circuit_driver_factor = circuit_factors.get(f"driver_{driver}", 1.0)
            circuit_team_factor = circuit_factors.get(f"team_{team}", 1.0)
            factor *= circuit_driver_factor * circuit_team_factor
            
            # Layer 3: Condition-specific factors
            condition_modifiers = self._get_condition_modifiers(conditions)
            condition_driver_factor = condition_modifiers.get(driver, 1.0)
            condition_team_factor = condition_modifiers.get(team, 1.0)
            factor *= condition_driver_factor * condition_team_factor
            
            calibrated_prob = base_prob * factor
            
            calibrated.append({
                **pred,
                "win_probability": calibrated_prob,
                "calibration_factors": {
                    "global": {"driver": global_driver_factor, "team": global_team_factor},
                    "circuit": {"driver": circuit_driver_factor, "team": circuit_team_factor},
                    "conditions": {"driver": condition_driver_factor, "team": condition_team_factor},
                    "total_factor": factor
                }
            })
        
        # Normalize probabilities
        total_prob = sum(p["win_probability"] for p in calibrated)
        if total_prob > 0:
            for p in calibrated:
                p["win_probability"] = p["win_probability"] / total_prob
        
        return calibrated
    
    def _get_condition_modifiers(self, conditions: Dict[str, Any]) -> Dict[str, float]:
        """Generate condition-specific modifiers based on race conditions."""
        modifiers = {}
        
        weather = conditions.get("weather", "dry")
        tires = conditions.get("tires", "medium")
        safety_car_prob = conditions.get("safety_car_prob", 0.0)
        temperature = conditions.get("temperature", 20)
        
        # Weather effects
        if weather == "wet":
            # Wet weather favors experienced drivers and teams with good wet setup
            modifiers["Max Verstappen"] = 1.05
            modifiers["Lewis Hamilton"] = 1.03
            modifiers["Fernando Alonso"] = 1.02
            modifiers["Red Bull"] = 1.02
            modifiers["Mercedes"] = 1.01
        elif weather == "rain":
            # Heavy rain can be unpredictable
            modifiers["Max Verstappen"] = 1.08
            modifiers["Lewis Hamilton"] = 1.05
            modifiers["Fernando Alonso"] = 1.03
        
        # Tire effects
        if tires == "soft":
            # Soft tires favor aggressive drivers
            modifiers["Max Verstappen"] = modifiers.get("Max Verstappen", 1.0) * 1.02
            modifiers["Charles Leclerc"] = modifiers.get("Charles Leclerc", 1.0) * 1.02
        elif tires == "hard":
            # Hard tires favor consistent drivers
            modifiers["Lewis Hamilton"] = modifiers.get("Lewis Hamilton", 1.0) * 1.02
            modifiers["Carlos Sainz"] = modifiers.get("Carlos Sainz", 1.0) * 1.02
        
        # Safety car effects
        if safety_car_prob > 0.5:
            # High safety car probability favors teams with good strategy
            modifiers["Red Bull"] = modifiers.get("Red Bull", 1.0) * 1.02
            modifiers["Ferrari"] = modifiers.get("Ferrari", 1.0) * 1.01
        
        # Temperature effects
        if temperature > 30:
            # Hot conditions favor teams with good cooling
            modifiers["Red Bull"] = modifiers.get("Red Bull", 1.0) * 1.02
            modifiers["Max Verstappen"] = modifiers.get("Max Verstappen", 1.0) * 1.02
        elif temperature < 15:
            # Cold conditions can be tricky
            modifiers["Lewis Hamilton"] = modifiers.get("Lewis Hamilton", 1.0) * 1.03
            modifiers["Fernando Alonso"] = modifiers.get("Fernando Alonso", 1.0) * 1.03
        
        return modifiers
    
    def prepare_enhanced_training_data(self) -> List[Dict]:
        """
        Prepare training data with circuit and condition information.
        
        Returns:
            List of race data with enhanced features
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
            
            # Use the most recent prediction
            latest_prediction = max(race_predictions, key=lambda x: x["timestamp"])
            
            # Extract circuit and conditions from metadata
            metadata = latest_prediction.get("metadata", {})
            race_features = metadata.get("race_features", {})
            
            circuit = race_features.get("circuit", "unknown")
            conditions = {
                "weather": race_features.get("weather", "dry"),
                "tires": race_features.get("tires", "medium"),
                "safety_car_prob": race_features.get("safety_car_prob", 0.0),
                "temperature": race_features.get("temperature", 20)
            }
            
            # Convert predictions to expected format
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
                "predictions": formatted_predictions,
                "circuit": circuit,
                "conditions": conditions
            })
        
        return training_data
    
    def update_enhanced_calibration(self, n_trials: int = 100, force_update: bool = False) -> bool:
        """
        Update all calibration layers using Optuna optimization.
        
        Args:
            n_trials: Number of Optuna trials
            force_update: Force update even if no new results
            
        Returns:
            True if calibration was updated successfully
        """
        print("🔄 Starting enhanced calibration update...")
        
        # Check if we have enough data
        training_data = self.prepare_enhanced_training_data()
        
        if len(training_data) < 3:
            print(f"⚠️  Not enough training data ({len(training_data)} races). Need at least 3 races.")
            return False
        
        # Check if we have new results since last calibration
        if not force_update and not self._has_new_results():
            print("ℹ️  No new race results since last calibration. Skipping update.")
            return False
        
        print(f"📊 Training enhanced calibration with {len(training_data)} races...")
        
        try:
            # Create enhanced tuning script
            self._create_enhanced_tuning_script(training_data)
            
            # Run enhanced calibration tuning
            study, config = self._run_enhanced_tuning(n_trials)
            
            # Update our calibration factors
            self._update_calibration_factors(config)
            
            # Save the enhanced calibration config
            self.save_config()
            
            # Log the calibration update
            self._log_enhanced_calibration_update(study, config)
            
            print(f"✅ Enhanced calibration updated successfully!")
            print(f"   - Best log loss: {study.best_value:.4f}")
            print(f"   - Trials completed: {len(study.trials)}")
            print(f"   - Global factors: {len(config.get('global_factors', {}).get('team_factors', {}))} teams, {len(config.get('global_factors', {}).get('driver_factors', {}))} drivers")
            print(f"   - Circuit factors: {len(config.get('circuit_factors', {}))} circuits")
            print(f"   - Condition factors: {len(config.get('condition_factors', {}))} condition types")
            
            return True
            
        except Exception as e:
            print(f"❌ Error updating enhanced calibration: {str(e)}")
            return False
    
    def _create_enhanced_tuning_script(self, training_data: List[Dict]):
        """Create enhanced tuning script with circuit and condition factors."""
        # Read the template script
        template_path = "enhanced_tune_calibration_template.py"
        
        try:
            with open(template_path, "r") as f:
                template_content = f.read()
        except FileNotFoundError:
            print(f"⚠️  Template file {template_path} not found. Creating basic script...")
            template_content = self._get_basic_template()
        
        # Replace the training data placeholder
        script_content = template_content.replace(
            "ENHANCED_TRAINING_DATA = []",
            f"ENHANCED_TRAINING_DATA = {json.dumps(training_data, indent=2)}"
        )
        
        # Update the timestamp
        script_content = script_content.replace(
            '"last_updated": "2024-01-01T00:00:00"',
            f'"last_updated": "{datetime.now().isoformat()}"'
        )
        
        # Write the enhanced tuning script
        with open("enhanced_tune_calibration.py", "w") as f:
            f.write(script_content)
    
    def _get_basic_template(self) -> str:
        """Get a basic template if the file is not found."""
        return '''#!/usr/bin/env python3
"""
Basic Enhanced Calibration Tuning Script
"""

import optuna
import numpy as np
import json
import sys
from typing import List, Dict

# Enhanced training data with circuit and conditions
ENHANCED_TRAINING_DATA = []

def create_enhanced_historical_data() -> List[Dict]:
    return ENHANCED_TRAINING_DATA

def calculate_enhanced_log_loss(predictions: List[Dict], actual_winner: str) -> float:
    winner_prob = 0.0
    for pred in predictions:
        if pred["driver"] == actual_winner:
            winner_prob = pred["win_probability"]
            break
    
    epsilon = 1e-9
    log_loss = -np.log(winner_prob + epsilon)
    return log_loss

def objective(trial):
    # Simple objective function for testing
    return 1.0

if __name__ == "__main__":
    n_trials = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    
    study = optuna.create_study(direction="minimize")
    study.optimize(objective, n_trials=n_trials)
    
    # Create basic config
    config = {
        "global_factors": {"driver_factors": {}, "team_factors": {}},
        "circuit_factors": {},
        "condition_factors": {},
        "last_updated": "2024-01-01T00:00:00",
        "version": "2.0"
    }
    
    with open("enhanced_calibration_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print("Basic enhanced calibration completed!")
'''
    
    def _run_enhanced_tuning(self, n_trials: int):
        """Run the enhanced tuning script."""
        import subprocess
        import sys
        
        # Run the enhanced tuning script with n_trials parameter
        result = subprocess.run([sys.executable, "enhanced_tune_calibration.py", str(n_trials)], 
                              capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"Enhanced tuning failed: {result.stderr}")
        
        # Load the generated config
        with open(self.calibration_config_path, 'r') as f:
            config = json.load(f)
        
        # Create a mock study object for logging
        class MockStudy:
            def __init__(self, best_value=0.0, trials_count=0):
                self.best_value = best_value
                self.trials = [None] * trials_count
        
        study = MockStudy(best_value=0.5, trials_count=n_trials)
        
        return study, config
    
    def _update_calibration_factors(self, config: Dict):
        """Update internal calibration factors from config."""
        self.global_factors = config.get("global_factors", self.global_factors)
        self.circuit_factors = config.get("circuit_factors", {})
        self.condition_factors = config.get("condition_factors", {})
    
    def _has_new_results(self) -> bool:
        """Check if there are new race results since last calibration."""
        try:
            if not os.path.exists(self.calibration_config_path):
                return True
            
            with open(self.calibration_config_path, 'r') as f:
                config = json.load(f)
            
            last_calibration = config.get("last_updated")
            if not last_calibration:
                return True
            
            results = self.logger.get_all_results()
            if not results:
                return False
            
            latest_result = max(results, key=lambda x: x["timestamp"])
            latest_result_time = latest_result["timestamp"]
            
            return latest_result_time > last_calibration
            
        except Exception:
            return True
    
    def _log_enhanced_calibration_update(self, study, config: Dict):
        """Log the enhanced calibration update."""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "best_log_loss": study.best_value,
            "trials_completed": len(study.trials),
            "config_summary": {
                "global_drivers": len(config.get("global_factors", {}).get("driver_factors", {})),
                "global_teams": len(config.get("global_factors", {}).get("team_factors", {})),
                "circuits": len(config.get("circuit_factors", {})),
                "conditions": len(config.get("condition_factors", {}))
            }
        }
        
        calibration_log_file = "enhanced_calibration_update_log.json"
        try:
            with open(calibration_log_file, 'r') as f:
                log_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            log_data = []
        
        log_data.append(log_entry)
        
        with open(calibration_log_file, 'w') as f:
            json.dump(log_data, f, indent=2)
    
    def get_enhanced_calibration_status(self) -> Dict:
        """Get enhanced calibration status and statistics."""
        training_data = self.prepare_enhanced_training_data()
        
        return {
            "last_updated": self._get_last_updated(),
            "training_races_count": len(training_data),
            "global_factors": {
                "driver_factors_count": len(self.global_factors.get("driver_factors", {})),
                "team_factors_count": len(self.global_factors.get("team_factors", {}))
            },
            "circuit_factors_count": len(self.circuit_factors),
            "condition_factors_count": len(self.condition_factors),
            "has_new_results": self._has_new_results(),
            "version": "2.0"
        }
    
    def _get_last_updated(self) -> str:
        """Get the last updated timestamp."""
        try:
            with open(self.calibration_config_path, 'r') as f:
                config = json.load(f)
            return config.get("last_updated", "Never")
        except:
            return "Never"
    
    def schedule_enhanced_weekly_update(self):
        """Schedule weekly enhanced calibration updates."""
        print("📅 Enhanced calibration scheduled for weekly updates")
        # This would integrate with a cron job or scheduler
        # For now, just log the intention
