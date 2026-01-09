#!/usr/bin/env python3
"""
Auto-Calibration Service using Optuna for F1 Prediction System

This service automatically optimizes calibration parameters based on historical race results
to improve prediction accuracy. It uses Optuna for Bayesian optimization and can be run
as a standalone script or integrated into a FastAPI backend.

Supports Race-Aware Calibration with separate qualifying and race modes.
"""

import json
import optuna
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Literal
from sklearn.metrics import log_loss, brier_score_loss
from pathlib import Path
import logging
from datetime import datetime
from calibration_utils import save_optuna_best_params, load_calibration_params_for_service, validate_calibration_params

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AutoCalibrationService:
    """
    Service for automatically tuning calibration parameters using Optuna.
    
    This service:
    1. Loads historical race results and model predictions
    2. Optimizes calibration parameters using Bayesian optimization
    3. Saves the best parameters to a configuration file
    4. Can be integrated into a FastAPI backend or run standalone
    5. Supports separate optimization for qualifying and race modes
    """
    
    def __init__(self, config_path: str = "enhanced_calibration_params.json"):
        self.config_path = config_path
        self.study = None
        self.best_params = None
        
    def load_historical_data(self, mode: Literal["qualifying", "race"] = "race") -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """
        Load historical race results and model predictions for the specified mode.
        
        Args:
            mode: "qualifying" or "race" to load appropriate historical data
            
        Returns:
            Tuple of (y_true, y_pred, driver_names)
            - y_true: Actual results (1 for winner/pole, 0 for others)
            - y_pred: Raw model predictions before calibration
            - driver_names: List of driver names
        """
        # This is a sample implementation - replace with your actual data loading
        # You can load from CSV, database, or API
        
        if mode == "race":
            # Sample historical race data
            sample_data = {
                "races": [
                    {
                        "race_name": "Monaco GP 2024",
                        "predictions": {
                            "Max Verstappen": 0.45,
                            "Lando Norris": 0.25,
                            "Oscar Piastri": 0.15,
                            "Charles Leclerc": 0.10,
                            "Lewis Hamilton": 0.05
                        },
                        "actual_winner": "Lando Norris"
                    },
                    {
                        "race_name": "Silverstone GP 2024", 
                        "predictions": {
                            "Max Verstappen": 0.40,
                            "Lando Norris": 0.30,
                            "Oscar Piastri": 0.20,
                            "Charles Leclerc": 0.08,
                            "Lewis Hamilton": 0.02
                        },
                        "actual_winner": "Oscar Piastri"
                    },
                    {
                        "race_name": "Spa GP 2024",
                        "predictions": {
                            "Max Verstappen": 0.50,
                            "Lando Norris": 0.25,
                            "Oscar Piastri": 0.15,
                            "Charles Leclerc": 0.08,
                            "Lewis Hamilton": 0.02
                        },
                        "actual_winner": "Max Verstappen"
                    }
                ]
            }
        else:  # qualifying mode
            # Sample historical qualifying data
            sample_data = {
                "races": [
                    {
                        "race_name": "Monaco GP 2024",
                        "predictions": {
                            "Max Verstappen": 0.40,
                            "Lando Norris": 0.20,
                            "Oscar Piastri": 0.15,
                            "Charles Leclerc": 0.15,
                            "Lewis Hamilton": 0.10
                        },
                        "actual_pole": "Charles Leclerc"
                    },
                    {
                        "race_name": "Silverstone GP 2024", 
                        "predictions": {
                            "Max Verstappen": 0.35,
                            "Lando Norris": 0.25,
                            "Oscar Piastri": 0.20,
                            "Charles Leclerc": 0.15,
                            "Lewis Hamilton": 0.05
                        },
                        "actual_pole": "Lando Norris"
                    },
                    {
                        "race_name": "Spa GP 2024",
                        "predictions": {
                            "Max Verstappen": 0.45,
                            "Lando Norris": 0.20,
                            "Oscar Piastri": 0.15,
                            "Charles Leclerc": 0.15,
                            "Lewis Hamilton": 0.05
                        },
                        "actual_pole": "Max Verstappen"
                    }
                ]
            }
        
        # Convert to numpy arrays
        y_true = []
        y_pred = []
        driver_names = list(sample_data["races"][0]["predictions"].keys())
        
        for race in sample_data["races"]:
            race_predictions = []
            actual_winner = race["actual_winner"] if mode == "race" else race["actual_pole"]
            
            for driver in driver_names:
                pred_prob = race["predictions"].get(driver, 0.0)
                race_predictions.append(pred_prob)
                
                # 1 if driver won/pole, 0 otherwise
                is_winner = 1 if driver == actual_winner else 0
                y_true.append(is_winner)
            
            y_pred.extend(race_predictions)
        
        return np.array(y_true), np.array(y_pred), driver_names
    
    def apply_calibration(self, predictions: np.ndarray, params: Dict[str, Any], mode: Literal["qualifying", "race"] = "race") -> np.ndarray:
        """
        Apply calibration using the given parameters for the specified mode.
        
        Args:
            predictions: Raw model predictions
            params: Calibration parameters from Optuna
            mode: "qualifying" or "race" mode
            
        Returns:
            Calibrated predictions
        """
        # Convert numpy array to list of dicts for the calibration pipeline
        driver_names = ["Max Verstappen", "Lando Norris", "Oscar Piastri", "Charles Leclerc", "Lewis Hamilton"]
        team_names = ["Red Bull Racing", "McLaren", "McLaren", "Ferrari", "Mercedes"]
        
        # Create prediction dicts
        prediction_dicts = []
        for i, pred in enumerate(predictions):
            if i < len(driver_names):
                prediction_dicts.append({
                    "driverName": driver_names[i],
                    "team": team_names[i],
                    "winProbability": pred,
                    "podiumProbability": pred * 2.5,  # Rough estimate
                    "position": i + 1
                })
        
        # Extract team and driver factors from params based on mode
        if mode == "qualifying":
            team_factors = {
                "McLaren": params.get('qualifying_team_weight_mclaren', 0.97),
                "Red Bull Racing": params.get('qualifying_team_weight_redbull', 1.02),
                "Ferrari": params.get('qualifying_team_weight_ferrari', 1.05),
                "Mercedes": params.get('qualifying_team_weight_mercedes', 1.02)
            }
            
            driver_factors = {
                "Max Verstappen": params.get('qualifying_driver_weight_verstappen', 1.05),
                "Lando Norris": params.get('qualifying_driver_weight_norris', 0.98),
                "Oscar Piastri": params.get('qualifying_driver_weight_piastri', 0.95),
                "Charles Leclerc": params.get('qualifying_driver_weight_leclerc', 1.08),
                "Lewis Hamilton": params.get('qualifying_driver_weight_hamilton', 1.04)
            }
        else:  # race mode
            team_factors = {
                "McLaren": params.get('race_team_weight_mclaren', 1.5),
                "Red Bull Racing": params.get('race_team_weight_redbull', 0.9),
                "Ferrari": params.get('race_team_weight_ferrari', 1.05),
                "Mercedes": params.get('race_team_weight_mercedes', 0.95)
            }
            
            driver_factors = {
                "Max Verstappen": params.get('race_driver_weight_verstappen', 0.95),
                "Lando Norris": params.get('race_driver_weight_norris', 1.1),
                "Oscar Piastri": params.get('race_driver_weight_piastri', 1.02),
                "Charles Leclerc": params.get('race_driver_weight_leclerc', 1.08),
                "Lewis Hamilton": params.get('race_driver_weight_hamilton', 1.0)
            }
        
        # Apply calibration using the dynamic pipeline with mode support
        from calibration_service import calibration_pipeline
        calibrated_dicts = calibration_pipeline(
            prediction_dicts,
            mode=mode,
            team_factors=team_factors,
            driver_factors=driver_factors,
            temperature=params.get('temperature', 1.0)
        )
        
        # Extract win probabilities back to numpy array
        calibrated = np.array([d["winProbability"] for d in calibrated_dicts])
        
        return calibrated
    
    def objective(self, trial: optuna.Trial, mode: Literal["qualifying", "race"] = "race") -> float:
        """
        Objective function for Optuna optimization.
        
        Args:
            trial: Optuna trial object
            mode: "qualifying" or "race" mode
            
        Returns:
            Loss value to minimize
        """
        # Load historical data for the specified mode
        y_true, y_pred, driver_names = self.load_historical_data(mode)
        
        # Suggest calibration parameters based on mode
        if mode == "qualifying":
            params = {
                'temperature': trial.suggest_float('temperature', 0.3, 1.5),
                'qualifying_team_weight_mclaren': trial.suggest_float('qualifying_team_weight_mclaren', 0.8, 1.2),
                'qualifying_team_weight_redbull': trial.suggest_float('qualifying_team_weight_redbull', 0.9, 1.3),
                'qualifying_team_weight_ferrari': trial.suggest_float('qualifying_team_weight_ferrari', 0.9, 1.3),
                'qualifying_team_weight_mercedes': trial.suggest_float('qualifying_team_weight_mercedes', 0.9, 1.3),
                'qualifying_driver_weight_verstappen': trial.suggest_float('qualifying_driver_weight_verstappen', 0.9, 1.3),
                'qualifying_driver_weight_norris': trial.suggest_float('qualifying_driver_weight_norris', 0.8, 1.2),
                'qualifying_driver_weight_piastri': trial.suggest_float('qualifying_driver_weight_piastri', 0.8, 1.2),
                'qualifying_driver_weight_leclerc': trial.suggest_float('qualifying_driver_weight_leclerc', 0.9, 1.3),
                'qualifying_driver_weight_hamilton': trial.suggest_float('qualifying_driver_weight_hamilton', 0.9, 1.3),
            }
        else:  # race mode
            params = {
                'temperature': trial.suggest_float('temperature', 0.3, 1.5),
                'race_team_weight_mclaren': trial.suggest_float('race_team_weight_mclaren', 1.0, 2.0),
                'race_team_weight_redbull': trial.suggest_float('race_team_weight_redbull', 0.5, 1.2),
                'race_team_weight_ferrari': trial.suggest_float('race_team_weight_ferrari', 0.8, 1.3),
                'race_team_weight_mercedes': trial.suggest_float('race_team_weight_mercedes', 0.8, 1.3),
                'race_driver_weight_verstappen': trial.suggest_float('race_driver_weight_verstappen', 0.7, 1.2),
                'race_driver_weight_norris': trial.suggest_float('race_driver_weight_norris', 0.9, 1.5),
                'race_driver_weight_piastri': trial.suggest_float('race_driver_weight_piastri', 0.9, 1.3),
                'race_driver_weight_leclerc': trial.suggest_float('race_driver_weight_leclerc', 0.9, 1.3),
                'race_driver_weight_hamilton': trial.suggest_float('race_driver_weight_hamilton', 0.8, 1.2),
            }
        
        # Apply calibration
        calibrated_preds = self.apply_calibration(y_pred, params, mode)
        
        # Calculate loss (combine log loss and Brier score)
        try:
            log_loss_val = log_loss(y_true, calibrated_preds)
            brier_loss_val = brier_score_loss(y_true, calibrated_preds)
            
            # Combine losses (you can adjust weights)
            total_loss = log_loss_val + 0.5 * brier_loss_val
            
            logger.info(f"Trial {trial.number} ({mode}): Loss = {total_loss:.4f} (Log: {log_loss_val:.4f}, Brier: {brier_loss_val:.4f})")
            
            return total_loss
            
        except Exception as e:
            logger.error(f"Error in trial {trial.number} ({mode}): {e}")
            return float('inf')
    
    def optimize(self, mode: Literal["qualifying", "race"] = "race", n_trials: int = 100, study_name: str = "f1_calibration") -> Dict[str, Any]:
        """
        Run optimization to find best calibration parameters for the specified mode.
        
        Args:
            mode: "qualifying" or "race" mode
            n_trials: Number of optimization trials
            study_name: Name for the Optuna study
            
        Returns:
            Best calibration parameters
        """
        logger.info(f"Starting {mode} optimization with {n_trials} trials...")
        
        # Create or load study with mode-specific name
        study_name_with_mode = f"{study_name}_{mode}"
        study = optuna.create_study(
            direction="minimize",
            study_name=study_name_with_mode,
            storage=None  # Use in-memory storage for simplicity
        )
        
        # Run optimization with mode-specific objective
        study.optimize(lambda trial: self.objective(trial, mode), n_trials=n_trials)
        
        # Get best parameters
        self.best_params = study.best_params
        self.study = study
        
        logger.info(f"{mode.capitalize()} optimization completed!")
        logger.info(f"Best loss: {study.best_value:.4f}")
        logger.info(f"Best parameters: {self.best_params}")
        
        return self.best_params
    
    def optimize_both_modes(self, n_trials: int = 100, study_name: str = "f1_calibration") -> Dict[str, Any]:
        """
        Run optimization for both qualifying and race modes.
        
        Args:
            n_trials: Number of optimization trials per mode
            study_name: Base name for the Optuna studies
            
        Returns:
            Combined best parameters for both modes
        """
        logger.info(f"Starting dual-mode optimization with {n_trials} trials per mode...")
        
        # Optimize qualifying mode
        qualifying_params = self.optimize("qualifying", n_trials, study_name)
        
        # Optimize race mode
        race_params = self.optimize("race", n_trials, study_name)
        
        # Combine parameters
        combined_params = {
            "temperature": qualifying_params.get("temperature", 0.55),  # Use qualifying temp as default
            "logistic_slope": 6.063542319320187,
            "logistic_intercept": -3.4323975147437498,
            "qualifying": {
                "team_factors": {
                    "McLaren": qualifying_params.get("qualifying_team_weight_mclaren", 0.97),
                    "Red Bull Racing": qualifying_params.get("qualifying_team_weight_redbull", 1.02),
                    "Ferrari": qualifying_params.get("qualifying_team_weight_ferrari", 1.05),
                    "Mercedes": qualifying_params.get("qualifying_team_weight_mercedes", 1.02),
                    "Aston Martin": 1.0,
                    "Alpine": 1.0,
                    "Haas": 1.0,
                    "RB": 1.0,
                    "Williams": 1.0,
                    "Kick Sauber": 1.0
                },
                "driver_factors": {
                    "Max Verstappen": qualifying_params.get("qualifying_driver_weight_verstappen", 1.05),
                    "Sergio Perez": 1.0,
                    "Lando Norris": qualifying_params.get("qualifying_driver_weight_norris", 0.98),
                    "Oscar Piastri": qualifying_params.get("qualifying_driver_weight_piastri", 0.95),
                    "Charles Leclerc": qualifying_params.get("qualifying_driver_weight_leclerc", 1.08),
                    "Carlos Sainz": 1.02,
                    "Lewis Hamilton": qualifying_params.get("qualifying_driver_weight_hamilton", 1.04),
                    "George Russell": 1.0,
                    "Fernando Alonso": 1.0,
                    "Lance Stroll": 1.0,
                    "Pierre Gasly": 1.0,
                    "Esteban Ocon": 1.0,
                    "Nico Hulkenberg": 1.0,
                    "Kevin Magnussen": 1.0,
                    "Yuki Tsunoda": 1.0,
                    "Daniel Ricciardo": 1.0,
                    "Alexander Albon": 1.0,
                    "Valtteri Bottas": 1.0,
                    "Zhou Guanyu": 1.0,
                    "Andrea Kimi Antonelli": 1.0,
                    "Oliver Bearman": 1.0
                }
            },
            "race": {
                "team_factors": {
                    "McLaren": race_params.get("race_team_weight_mclaren", 1.5),
                    "Red Bull Racing": race_params.get("race_team_weight_redbull", 0.9),
                    "Ferrari": race_params.get("race_team_weight_ferrari", 1.05),
                    "Mercedes": race_params.get("race_team_weight_mercedes", 0.95),
                    "Aston Martin": 1.0,
                    "Alpine": 1.0,
                    "Haas": 1.0,
                    "RB": 1.0,
                    "Williams": 1.0,
                    "Kick Sauber": 1.0
                },
                "driver_factors": {
                    "Max Verstappen": race_params.get("race_driver_weight_verstappen", 0.95),
                    "Sergio Perez": 1.0,
                    "Lando Norris": race_params.get("race_driver_weight_norris", 1.1),
                    "Oscar Piastri": race_params.get("race_driver_weight_piastri", 1.02),
                    "Charles Leclerc": race_params.get("race_driver_weight_leclerc", 1.08),
                    "Carlos Sainz": 0.97,
                    "Lewis Hamilton": race_params.get("race_driver_weight_hamilton", 1.0),
                    "George Russell": 1.0,
                    "Fernando Alonso": 1.0,
                    "Lance Stroll": 1.0,
                    "Pierre Gasly": 1.0,
                    "Esteban Ocon": 1.0,
                    "Nico Hulkenberg": 1.0,
                    "Kevin Magnussen": 1.0,
                    "Yuki Tsunoda": 1.0,
                    "Daniel Ricciardo": 1.0,
                    "Alexander Albon": 1.0,
                    "Valtteri Bottas": 1.0,
                    "Zhou Guanyu": 1.0,
                    "Andrea Kimi Antonelli": 1.0,
                    "Oliver Bearman": 1.0
                }
            },
            "track_type_adjustments": {
                "street_circuit": 1.15,
                "permanent_circuit": 1.0,
                "high_speed": 0.95
            }
        }
        
        self.best_params = combined_params
        logger.info("Dual-mode optimization completed successfully!")
        
        return combined_params
    
    def save_parameters(self, params: Optional[Dict[str, Any]] = None) -> None:
        """
        Save calibration parameters to JSON file using the calibration utilities.
        
        Args:
            params: Parameters to save (uses best_params if None)
        """
        if params is None:
            params = self.best_params
        
        if params is None:
            raise ValueError("No parameters to save. Run optimize() first or provide params.")
        
        # Validate parameters before saving
        if not validate_calibration_params(params):
            logger.warning("Parameter validation failed, but continuing with save...")
        
        # Use the calibration utility to save parameters
        if self.study:
            success = save_optuna_best_params(self.study, self.config_path)
        else:
            # If no study, save parameters directly
            from calibration_utils import quick_save_params
            success = quick_save_params(params, self.config_path)
        
        if success:
            logger.info(f"Calibration parameters saved to {self.config_path}")
        else:
            logger.error(f"Failed to save calibration parameters to {self.config_path}")
    
    def load_parameters(self) -> Optional[Dict[str, Any]]:
        """
        Load calibration parameters from JSON file using the calibration utilities.
        
        Returns:
            Loaded parameters or None if loading failed
        """
        params = load_calibration_params_for_service(self.config_path)
        if params:
            logger.info(f"Calibration parameters loaded from {self.config_path}")
        else:
            logger.warning(f"No calibration parameters found at {self.config_path}")
        return params
    
    def generate_typescript_params(self, params: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate TypeScript parameter export for the frontend service.
        
        Args:
            params: Parameters to convert (uses best_params if None)
            
        Returns:
            TypeScript code string
        """
        if params is None:
            params = self.best_params
        
        if params is None:
            raise ValueError("No parameters to convert. Run optimize() first or provide params.")
        
        ts_code = f"""// Auto-generated calibration parameters
// Generated at: {datetime.now().isoformat()}
// Best loss: {self.study.best_value if self.study else 'N/A'}

export const ENHANCED_CALIBRATION_PARAMS: EnhancedCalibrationParams = {{
  temperature: {params.get('temperature', 0.55)},
  logisticSlope: 6.063542319320187,
  logisticIntercept: -3.4323975147437498,
  driverBiases: {{
    "Max Verstappen": {params.get('verstappen_penalty', -0.05)},
    "Lando Norris": 0.10,
    "Oscar Piastri": 0.08,
    "George Russell": 0.02,
    "Lewis Hamilton": 0.02,
    "Charles Leclerc": 0.02,
    "Carlos Sainz": 0.02,
    "Fernando Alonso": 0.01,
    // ... other drivers with 0.0 bias
  }},
  teamWeights: {{
    "McLaren": {params.get('team_weight_mclaren', 1.5)},
    "Red Bull Racing": {params.get('team_weight_redbull', 0.9)},
    "Ferrari": 1.05,
    "Mercedes": 0.95,
    // ... other teams with 1.0 weight
  }},
  recentFormWeights: {{
    "Lando Norris": {params.get('form_boost_norris', 1.6)},
    "Oscar Piastri": {params.get('form_boost_piastri', 1.5)},
    "Max Verstappen": 0.9,
    // ... other drivers with 1.0 weight
  }},
  trackTypeAdjustments: {{
    "street_circuit": 1.15,
    "permanent_circuit": 1.0,
    "high_speed": 0.95
  }}
}};
"""
        return ts_code
    
    def run_optimization_pipeline(self, mode: Literal["qualifying", "race", "both"] = "both", n_trials: int = 100) -> Dict[str, Any]:
        """
        Complete optimization pipeline: optimize, save, and generate TypeScript.
        
        Args:
            mode: "qualifying", "race", or "both" for dual-mode optimization
            n_trials: Number of optimization trials per mode
            
        Returns:
            Best parameters
        """
        logger.info(f"Starting complete optimization pipeline for {mode} mode...")
        
        # Run optimization based on mode
        if mode == "both":
            best_params = self.optimize_both_modes(n_trials=n_trials)
        else:
            best_params = self.optimize(mode, n_trials=n_trials)
        
        # Save parameters
        self.save_parameters()
        
        # Generate TypeScript code
        ts_code = self.generate_typescript_params()
        
        # Save TypeScript code to file
        ts_path = self.config_path.replace('.json', '.ts')
        with open(ts_path, 'w') as f:
            f.write(ts_code)
        
        logger.info(f"TypeScript parameters saved to {ts_path}")
        logger.info("Optimization pipeline completed successfully!")
        
        return best_params

def main():
    """Main function for standalone execution."""
    import argparse
    
    parser = argparse.ArgumentParser(description="F1 Calibration Auto-Tuning Service")
    parser.add_argument("--trials", type=int, default=100, help="Number of optimization trials per mode")
    parser.add_argument("--mode", type=str, choices=["qualifying", "race", "both"], default="both",
                       help="Calibration mode to optimize")
    parser.add_argument("--config", type=str, default="enhanced_calibration_params.json", 
                       help="Output configuration file path")
    parser.add_argument("--study-name", type=str, default="f1_calibration",
                       help="Optuna study name")
    
    args = parser.parse_args()
    
    # Create and run service
    service = AutoCalibrationService(config_path=args.config)
    
    try:
        best_params = service.run_optimization_pipeline(mode=args.mode, n_trials=args.trials)
        print(f"\n✅ {args.mode.capitalize()} optimization completed successfully!")
        print(f"📊 Best parameters: {best_params}")
        print(f"📁 Configuration saved to: {args.config}")
        print(f"📁 TypeScript saved to: {args.config.replace('.json', '.ts')}")
        
    except Exception as e:
        logger.error(f"Optimization failed: {e}")
        raise

if __name__ == "__main__":
    main()
