import json
import math
from typing import List, Dict, Optional
import numpy as np

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

def calibration_pipeline(
    predictions: List[Dict], 
    team_factors: Optional[Dict] = None,
    driver_factors: Optional[Dict] = None,
    config_path: Optional[str] = None
) -> List[Dict]:
    """
    Full calibration pipeline with dynamic parameters.
    
    Args:
        predictions: List of prediction dicts
        team_factors: Dict of team calibration multipliers (optional)
        driver_factors: Dict of driver calibration multipliers (optional)
        config_path: Path to load calibration config from (optional)
        
    Returns:
        List of predictions with full calibration applied
    """
    # Load config if provided and no factors given
    if config_path and not team_factors and not driver_factors:
        config = load_calibration_config(config_path)
        team_factors = config.get("team_factors")
        driver_factors = config.get("driver_factors")
    
    # Step 1: Apply team calibration
    predictions = apply_team_calibration(predictions, team_factors)
    
    # Step 2: Driver-level calibration
    predictions = apply_driver_calibration(predictions, driver_factors)
    
    # Step 3: Normalize probabilities
    predictions = normalize_probabilities(predictions)
    
    # Step 4: Podium cap (if podium_probability exists)
    if any("podium_probability" in p for p in predictions):
        predictions = cap_team_podium_probabilities(predictions)
    
    return predictions

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
