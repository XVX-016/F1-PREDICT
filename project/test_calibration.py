#!/usr/bin/env python3
"""
Test script for the F1 prediction calibration system.
Demonstrates how to use the calibration pipeline with sample data.
"""

from simple_calibration_service import calibration_pipeline, save_calibration_config
import json

def test_basic_calibration():
    """Test basic calibration functionality with sample data."""
    print("=== Testing Basic Calibration ===")
    
    # Sample predictions (before calibration)
    sample_predictions = [
        {"driver": "Max Verstappen", "team": "Red Bull", "win_probability": 0.35},
        {"driver": "Lando Norris", "team": "McLaren", "win_probability": 0.25},
        {"driver": "Charles Leclerc", "team": "Ferrari", "win_probability": 0.20},
        {"driver": "Oscar Piastri", "team": "McLaren", "win_probability": 0.15},
        {"driver": "Carlos Sainz", "team": "Ferrari", "win_probability": 0.05}
    ]
    
    print("Original predictions:")
    for pred in sample_predictions:
        print(f"  {pred['driver']} ({pred['team']}): {pred['win_probability']:.3f}")
    
    # Apply manual calibration factors
    team_factors = {
        "Red Bull": 0.95,    # Slight penalty for Red Bull
        "McLaren": 1.10,     # Boost for McLaren
        "Ferrari": 1.05      # Small boost for Ferrari
    }
    
    driver_factors = {
        "Max Verstappen": 1.05,  # Keep Max strong
        "Lando Norris": 1.15,    # Big boost for Norris
        "Oscar Piastri": 1.02,   # Small boost for Piastri
        "Charles Leclerc": 1.08, # Boost for Leclerc
        "Carlos Sainz": 0.97     # Slight penalty for Sainz
    }
    
    # Apply calibration
    calibrated = calibration_pipeline(
        sample_predictions,
        team_factors=team_factors,
        driver_factors=driver_factors
    )
    
    print("\nCalibrated predictions:")
    for pred in calibrated:
        print(f"  {pred['driver']} ({pred['team']}): {pred['win_probability']:.3f}")
    
    return calibrated

def test_config_save_load():
    """Test saving and loading calibration config."""
    print("\n=== Testing Config Save/Load ===")
    
    # Create sample config
    config = {
        "team_factors": {
            "Red Bull": 0.95,
            "McLaren": 1.10,
            "Ferrari": 1.05,
            "Mercedes": 0.98
        },
        "driver_factors": {
            "Max Verstappen": 1.05,
            "Lando Norris": 1.15,
            "Charles Leclerc": 1.08
        }
    }
    
    # Save config
    save_calibration_config(config, "test_config.json")
    print("Config saved to test_config.json")
    
    # Test loading and using config
    sample_predictions = [
        {"driver": "Max Verstappen", "team": "Red Bull", "win_probability": 0.40},
        {"driver": "Lando Norris", "team": "McLaren", "win_probability": 0.30},
        {"driver": "Charles Leclerc", "team": "Ferrari", "win_probability": 0.30}
    ]
    
    calibrated = calibration_pipeline(sample_predictions, config_path="test_config.json")
    
    print("Predictions using loaded config:")
    for pred in calibrated:
        print(f"  {pred['driver']}: {pred['win_probability']:.3f}")

def test_podium_capping():
    """Test podium probability capping functionality."""
    print("\n=== Testing Podium Capping ===")
    
    # Sample predictions with podium probabilities
    sample_predictions = [
        {"driver": "Lando Norris", "team": "McLaren", "win_probability": 0.30, "podium_probability": 0.85},
        {"driver": "Oscar Piastri", "team": "McLaren", "win_probability": 0.25, "podium_probability": 0.75},
        {"driver": "Charles Leclerc", "team": "Ferrari", "win_probability": 0.25, "podium_probability": 0.70},
        {"driver": "Max Verstappen", "team": "Red Bull", "win_probability": 0.20, "podium_probability": 0.60}
    ]
    
    print("Original predictions with podium probabilities:")
    for pred in sample_predictions:
        print(f"  {pred['driver']}: Win={pred['win_probability']:.3f}, Podium={pred['podium_probability']:.3f}")
    
    # Apply calibration with podium capping
    calibrated = calibration_pipeline(sample_predictions)
    
    print("\nCalibrated predictions (with podium capping):")
    for pred in calibrated:
        podium_prob = pred.get('podium_probability', 'N/A')
        print(f"  {pred['driver']}: Win={pred['win_probability']:.3f}, Podium={podium_prob}")

def main():
    """Run all calibration tests."""
    print("🚀 F1 Prediction Calibration System Test")
    print("=" * 50)
    
    # Test basic calibration
    test_basic_calibration()
    
    # Test config save/load
    test_config_save_load()
    
    # Test podium capping
    test_podium_capping()
    
    print("\n✅ All tests completed!")
    print("\nNext steps:")
    print("1. Replace sample data in tune_calibration.py with your historical race data")
    print("2. Run: python tune_calibration.py")
    print("3. Use the generated calibration_config.json in your live prediction service")

if __name__ == "__main__":
    main()
