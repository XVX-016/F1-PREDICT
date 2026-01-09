#!/usr/bin/env python3
"""
Dynamic Calibration Service for F1 Prediction System

This service provides a flexible calibration pipeline that can accept team and driver
factors dynamically, making it compatible with Optuna optimization and other tuning systems.
Supports Race-Aware Calibration with separate qualifying and race modes.
"""

import json
import math
from typing import List, Dict, Optional, Literal, Any, Tuple
import numpy as np
from calibration_utils import load_calibration_params_for_service, validate_calibration_params

def load_calibration_config(config_path: str = "calibration_config.json") -> Dict:
    """
    Load calibration parameters from JSON config file.
    
    Args:
        config_path: Path to the calibration config JSON file
        
    Returns:
        Dict containing team_factors and driver_factors
    """
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        print(f"Warning: {config_path} not found. Using default calibration.")
        return {}

def save_calibration_config(params: Dict, config_path: str = "calibration_config.json"):
    """
    Save calibration parameters to JSON config file.
    
    Args:
        params: Dict containing team_factors and driver_factors
        config_path: Path to save the calibration config JSON file
    """
    with open(config_path, 'w') as f:
        json.dump(params, f, indent=2)
    print(f"Calibration config saved to {config_path}")

def apply_team_calibration(predictions: List[Dict], team_factors: Optional[Dict] = None) -> List[Dict]:
    """
    Apply team-level calibration factors.
    
    Args:
        predictions: List of prediction dicts
        team_factors: Dict of team calibration multipliers
        
    Returns:
        List of predictions with team calibration applied
    """
    if not team_factors:
        return predictions
        
    calibrated = []
    for p in predictions:
        factor = team_factors.get(p["team"], 1.0)
        calibrated_prob = p["win_probability"] * factor
        calibrated.append({
            **p,
            "win_probability": calibrated_prob
        })
    return calibrated

def apply_driver_calibration(predictions: List[Dict], driver_factors: Optional[Dict] = None) -> List[Dict]:
    """
    Apply driver-specific calibration factors on top of team calibration.
    
    Args:
        predictions: List of prediction dicts
        driver_factors: Dict of driver calibration multipliers
        
    Returns:
        List of predictions with driver calibration applied
    """
    if not driver_factors:
        return predictions
        
    calibrated = []
    for p in predictions:
        factor = driver_factors.get(p["driver"], 1.0)
        calibrated_prob = p["win_probability"] * factor
        calibrated.append({
            **p,
            "win_probability": calibrated_prob
        })
    return calibrated

def cap_team_podium_probabilities(predictions: List[Dict], max_team_podium_prob: float = 0.25) -> List[Dict]:
    """
    Prevents calibration from pushing both team drivers unrealistically onto the podium.
    
    Args:
        predictions: List of prediction dicts
        max_team_podium_prob: Maximum probability for second driver of same team
        
    Returns:
        List of predictions with podium probabilities capped
    """
    team_counts = {}
    capped = []
    sorted_preds = sorted(predictions, key=lambda x: x["podium_probability"], reverse=True)

    for p in sorted_preds:
        team = p["team"]
        team_counts[team] = team_counts.get(team, 0) + 1

        # If it's the second driver and already too high → cap it
        if team_counts[team] > 1 and p["podium_probability"] > max_team_podium_prob:
            p = {**p, "podium_probability": max_team_podium_prob}
        capped.append(p)

    return capped

def normalize_probabilities(predictions: List[Dict]) -> List[Dict]:
    """
    Normalize probabilities so they sum to 1.0.
    
    Args:
        predictions: List of prediction dicts
        
    Returns:
        List of predictions with normalized probabilities
    """
    total = sum(p["win_probability"] for p in predictions)
    if total <= 0:
        return predictions
        
    normalized = []
    for p in predictions:
        normalized.append({
            **p,
            "win_probability": p["win_probability"] / total
        })
    return normalized

class CalibrationService:
    """
    Dynamic calibration service that can apply various calibration factors
    to F1 race predictions with support for qualifying vs race modes.
    """
    
    def __init__(self, config_path: str = "calibration_config.json"):
        self.config_path = config_path
        self.default_params = self._get_default_params()
    
    def _get_default_params(self) -> Dict[str, Any]:
        """Get default calibration parameters with qualifying and race modes."""
        return {
            "temperature": 0.55,
            "logistic_slope": 6.063542319320187,
            "logistic_intercept": -3.4323975147437498,
            "qualifying": {
                "team_factors": {
                    "McLaren": 0.97,
                    "Red Bull Racing": 1.02,
                    "Ferrari": 1.05,
                    "Mercedes": 1.02,
                    "Aston Martin": 1.0,
                    "Alpine": 1.0,
                    "Haas": 1.0,
                    "RB": 1.0,
                    "Williams": 1.0,
                    "Kick Sauber": 1.0
                },
                "driver_factors": {
                    "Max Verstappen": 1.05,
                    "Sergio Perez": 1.0,
                    "Lando Norris": 0.98,
                    "Oscar Piastri": 0.95,
                    "Charles Leclerc": 1.08,
                    "Carlos Sainz": 1.02,
                    "Lewis Hamilton": 1.04,
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
                    "McLaren": 1.5,
                    "Red Bull Racing": 0.9,
                    "Ferrari": 1.05,
                    "Mercedes": 0.95,
                    "Aston Martin": 1.0,
                    "Alpine": 1.0,
                    "Haas": 1.0,
                    "RB": 1.0,
                    "Williams": 1.0,
                    "Kick Sauber": 1.0
                },
                "driver_factors": {
                    "Max Verstappen": 0.95,
                    "Sergio Perez": 1.0,
                    "Lando Norris": 1.1,
                    "Oscar Piastri": 1.02,
                    "Charles Leclerc": 1.08,
                    "Carlos Sainz": 0.97,
                    "Lewis Hamilton": 1.0,
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
    
    def load_calibration_params(self) -> Dict[str, Any]:
        """
        Load calibration parameters from config file or use defaults.
        
        Returns:
            Dictionary of calibration parameters
        """
        params = load_calibration_params_for_service(self.config_path)
        if params and validate_calibration_params(params):
            return params
        else:
            print(f"Using default calibration parameters (no valid config found at {self.config_path})")
            return self.default_params
    
    def calibration_pipeline(
        self, 
        predicted_probs: List[Dict[str, Any]], 
        mode: Literal["qualifying", "race"] = "race",
        team_factors: Optional[Dict[str, float]] = None,
        driver_factors: Optional[Dict[str, float]] = None,
        track_type: str = "permanent_circuit",
        temperature: Optional[float] = None,
        logistic_slope: Optional[float] = None,
        logistic_intercept: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Apply comprehensive calibration to predicted probabilities with mode support.
        
        Args:
            predicted_probs: List of driver prediction dictionaries
            mode: Calibration mode - "qualifying" or "race"
            team_factors: Optional team-specific multipliers (overrides mode defaults)
            driver_factors: Optional driver-specific multipliers (overrides mode defaults)
            track_type: Type of track for adjustments
            temperature: Temperature scaling parameter
            logistic_slope: Logistic calibration slope
            logistic_intercept: Logistic calibration intercept
            
        Returns:
            List of calibrated driver predictions
        """
        # Load default parameters if not provided
        if team_factors is None or driver_factors is None:
            params = self.load_calibration_params()
            
            # Get mode-specific factors
            mode_params = params.get(mode, {})
            team_factors = team_factors or mode_params.get("team_factors", {})
            driver_factors = driver_factors or mode_params.get("driver_factors", {})
            
            # Global parameters
            temperature = temperature or params.get("temperature", 1.0)
            logistic_slope = logistic_slope or params.get("logistic_slope", 1.0)
            logistic_intercept = logistic_intercept or params.get("logistic_intercept", 0.0)
        
        calibrated = []
        
        for entry in predicted_probs:
            # Extract base probabilities
            win_prob = entry.get("winProbability", 0.0)
            podium_prob = entry.get("podiumProbability", 0.0)
            driver_name = entry.get("driverName", "")
            team_name = entry.get("team", "")
            
            # Apply temperature scaling
            if temperature != 1.0:
                win_prob = self._apply_temperature_scaling(win_prob, temperature)
                podium_prob = self._apply_temperature_scaling(podium_prob, temperature)
            
            # Apply logistic calibration
            if logistic_slope != 1.0 or logistic_intercept != 0.0:
                win_prob = self._apply_logistic_calibration(win_prob, logistic_slope, logistic_intercept)
                podium_prob = self._apply_logistic_calibration(podium_prob, logistic_slope, logistic_intercept)
            
            # Apply team weighting
            if team_name in team_factors:
                team_multiplier = team_factors[team_name]
                win_prob *= team_multiplier
                podium_prob *= team_multiplier
            
            # Apply driver-specific calibration
            if driver_name in driver_factors:
                driver_multiplier = driver_factors[driver_name]
                win_prob *= driver_multiplier
                podium_prob *= driver_multiplier
            
            # Apply track type adjustments
            track_adjustment = self._get_track_adjustment(track_type)
            if track_adjustment != 1.0:
                win_prob *= track_adjustment
                podium_prob *= track_adjustment
            
            # Store calibrated probabilities
            calibrated_entry = entry.copy()
            calibrated_entry["winProbability"] = max(0.0, min(1.0, win_prob))
            calibrated_entry["podiumProbability"] = max(0.0, min(1.0, podium_prob))
            calibrated.append(calibrated_entry)
        
        # Normalize probabilities
        calibrated = self._normalize_probabilities(calibrated)
        
        # Apply podium probability capping per team (only for race mode)
        if mode == "race":
            calibrated = self._cap_team_podium_probabilities(calibrated)
        
        # Sort by win probability
        calibrated.sort(key=lambda x: x["winProbability"], reverse=True)
        
        # Update positions
        for i, entry in enumerate(calibrated):
            entry["position"] = i + 1
        
        return calibrated
    
    def _apply_temperature_scaling(self, prob: float, temperature: float) -> float:
        """Apply temperature scaling to a probability."""
        if temperature is None or temperature <= 0:
            return prob
        
        # Softmax-like scaling
        scaled = math.exp(math.log(prob + 1e-9) / temperature)
        return scaled
    
    def _apply_logistic_calibration(self, prob: float, slope: float, intercept: float) -> float:
        """Apply logistic calibration to a probability."""
        # Handle None values
        if slope is None or intercept is None:
            return prob
        
        # Transform to logit space, apply calibration, transform back
        logit = math.log(prob / (1 - prob + 1e-9))
        calibrated_logit = slope * logit + intercept
        calibrated_prob = 1 / (1 + math.exp(-calibrated_logit))
        return calibrated_prob
    
    def _get_track_adjustment(self, track_type: str) -> float:
        """Get track type adjustment multiplier."""
        params = self.load_calibration_params()
        track_adjustments = params.get("track_type_adjustments", {})
        return track_adjustments.get(track_type, 1.0)
    
    def _normalize_probabilities(self, predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normalize win and podium probabilities to sum to 1."""
        # Normalize win probabilities
        total_win = sum(p.get("winProbability", 0) for p in predictions)
        if total_win > 0:
            for p in predictions:
                p["winProbability"] = p.get("winProbability", 0) / total_win
        
        # Normalize podium probabilities
        total_podium = sum(p.get("podiumProbability", 0) for p in predictions)
        if total_podium > 0:
            for p in predictions:
                p["podiumProbability"] = p.get("podiumProbability", 0) / total_podium
        
        return predictions
    
    def _cap_team_podium_probabilities(self, predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Cap podium probabilities per team to prevent unrealistic team dominance.
        
        This ensures that if a team has multiple drivers with high podium probabilities,
        the second driver's probability is capped to prevent unrealistic scenarios.
        """
        team_podium_counts = {}
        team_primary_drivers = {}
        
        # Create a mapping of driver names to their predictions for easier lookup
        driver_to_pred = {pred.get("driverName", ""): pred for pred in predictions}
        
        # Identify primary drivers per team (highest podium probability)
        for pred in predictions:
            team = pred.get("team", "")
            driver = pred.get("driverName", "")
            podium_prob = pred.get("podiumProbability", 0)
            
            if team not in team_primary_drivers:
                team_primary_drivers[team] = driver
            else:
                # Compare with existing primary driver's podium probability
                primary_driver = team_primary_drivers[team]
                primary_pred = driver_to_pred.get(primary_driver, {})
                primary_podium_prob = primary_pred.get("podiumProbability", 0)
                
                if podium_prob > primary_podium_prob:
                    team_primary_drivers[team] = driver
        
        # Apply capping
        for pred in predictions:
            team = pred.get("team", "")
            driver = pred.get("driverName", "")
            podium_prob = pred.get("podiumProbability", 0)
            
            # Count how many drivers from this team we've seen
            if team not in team_podium_counts:
                team_podium_counts[team] = 0
            team_podium_counts[team] += 1
            
            # If this is the second driver from the team and not the primary driver
            if (team_podium_counts[team] > 1 and 
                driver != team_primary_drivers.get(team, "") and 
                podium_prob > 0.25):
                pred["podiumProbability"] = 0.25
        
        return predictions
    
    def evaluate_calibration(
        self, 
        predictions: List[Dict[str, Any]], 
        actual_results: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """
        Evaluate calibration quality using various metrics.
        
        Args:
            predictions: Calibrated predictions
            actual_results: Actual race results
            
        Returns:
            Dictionary of evaluation metrics
        """
        # This is a simplified evaluation - in practice you'd want more sophisticated metrics
        metrics = {
            "brier_score": 0.0,
            "log_loss": 0.0,
            "calibration_error": 0.0
        }
        
        # Calculate basic metrics (simplified)
        total_predictions = len(predictions)
        if total_predictions > 0:
            # Calculate average prediction confidence
            avg_confidence = sum(p.get("winProbability", 0) for p in predictions) / total_predictions
            metrics["avg_confidence"] = avg_confidence
        
        return metrics

# Global instance for easy access
calibration_service = CalibrationService()

def calibration_pipeline(
    predicted_probs: List[Dict[str, Any]], 
    mode: Literal["qualifying", "race"] = "race",
    team_factors: Optional[Dict[str, float]] = None,
    driver_factors: Optional[Dict[str, float]] = None,
    track_type: str = "permanent_circuit",
    **kwargs
) -> List[Dict[str, Any]]:
    """
    Convenience function for applying calibration pipeline with mode support.
    
    Args:
        predicted_probs: List of driver prediction dictionaries
        mode: Calibration mode - "qualifying" or "race"
        team_factors: Optional team-specific multipliers (overrides mode defaults)
        driver_factors: Optional driver-specific multipliers (overrides mode defaults)
        track_type: Type of track for adjustments
        **kwargs: Additional calibration parameters
        
    Returns:
        List of calibrated driver predictions
    """
    return calibration_service.calibration_pipeline(
        predicted_probs, mode, team_factors, driver_factors, track_type, **kwargs
    )

def extract_calibration_params(optuna_params: Dict) -> Dict:
    """
    Extract team and driver factors from Optuna trial parameters.
    
    Args:
        optuna_params: Dict from optuna study.best_params
        
    Returns:
        Dict with team_factors and driver_factors separated
    """
    team_factors = {}
    driver_factors = {}
    
    for key, value in optuna_params.items():
        if key.startswith("team_"):
            team_name = key.replace("team_", "")
            team_factors[team_name] = value
        elif key.startswith("driver_"):
            driver_name = key.replace("driver_", "")
            driver_factors[driver_name] = value
    
    return {
        "team_factors": team_factors,
        "driver_factors": driver_factors
    }
