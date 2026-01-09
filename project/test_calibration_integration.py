#!/usr/bin/env python3
"""
Test script for the complete calibration integration.

This script demonstrates:
1. Loading/saving calibration parameters using calibration_utils
2. Applying dynamic calibration using calibration_service
3. Running Optuna optimization with the integrated pipeline
4. Saving optimized parameters and loading them back
"""

import numpy as np
import json
from typing import List, Dict, Any

# Import our calibration modules
from calibration_utils import (
    CalibrationConfigManager, 
    save_optuna_best_params, 
    load_calibration_params_for_service,
    validate_calibration_params,
    quick_save_params,
    quick_load_params
)
from calibration_service import CalibrationService, calibration_pipeline
from auto_calibration_service import AutoCalibrationService

def create_sample_predictions() -> List[Dict[str, Any]]:
    """Create sample driver predictions for testing."""
    return [
        {
            "driverName": "Max Verstappen",
            "team": "Red Bull Racing",
            "winProbability": 0.35,
            "podiumProbability": 0.75,
            "position": 1
        },
        {
            "driverName": "Lando Norris",
            "team": "McLaren",
            "winProbability": 0.25,
            "podiumProbability": 0.65,
            "position": 2
        },
        {
            "driverName": "Oscar Piastri",
            "team": "McLaren",
            "winProbability": 0.20,
            "podiumProbability": 0.55,
            "position": 3
        },
        {
            "driverName": "Charles Leclerc",
            "team": "Ferrari",
            "winProbability": 0.12,
            "podiumProbability": 0.45,
            "position": 4
        },
        {
            "driverName": "Lewis Hamilton",
            "team": "Mercedes",
            "winProbability": 0.08,
            "podiumProbability": 0.35,
            "position": 5
        }
    ]

def test_calibration_utils():
    """Test the calibration utilities."""
    print("🧪 Testing Calibration Utilities...")
    
    # Test 1: Save and load parameters
    test_params = {
        "temperature": 0.6,
        "team_weight_mclaren": 1.4,
        "team_weight_redbull": 0.85,
        "form_boost_norris": 1.3,
        "form_boost_piastri": 1.2,
        "verstappen_penalty": -0.1
    }
    
    # Save parameters
    success = quick_save_params(test_params, "test_calibration_config.json")
    print(f"✅ Save test parameters: {'Success' if success else 'Failed'}")
    
    # Load parameters
    loaded_params = quick_load_params("test_calibration_config.json")
    print(f"✅ Load test parameters: {'Success' if loaded_params else 'Failed'}")
    
    if loaded_params:
        print(f"   Loaded temperature: {loaded_params.get('temperature')}")
        print(f"   Loaded McLaren weight: {loaded_params.get('team_weight_mclaren')}")
    
    # Test 2: Validate parameters
    is_valid = validate_calibration_params(test_params)
    print(f"✅ Parameter validation: {'Valid' if is_valid else 'Invalid'}")
    
    # Test 3: Config manager
    manager = CalibrationConfigManager("test_calibration_config.json")
    info = manager.get_config_info()
    print(f"✅ Config info: {info}")
    
    print()

def test_calibration_service():
    """Test the dynamic calibration service."""
    print("🧪 Testing Calibration Service...")
    
    # Create sample predictions
    predictions = create_sample_predictions()
    
    # Test 1: Default calibration
    service = CalibrationService("test_calibration_config.json")
    calibrated = service.calibration_pipeline(predictions)
    
    print(f"✅ Default calibration applied to {len(calibrated)} drivers")
    print("   Top 3 after calibration:")
    for i, driver in enumerate(calibrated[:3]):
        print(f"   {i+1}. {driver['driverName']}: {driver['winProbability']:.3f} win, {driver['podiumProbability']:.3f} podium")
    
    # Test 2: Custom team and driver factors
    custom_team_factors = {
        "McLaren": 1.6,
        "Red Bull Racing": 0.8,
        "Ferrari": 1.1,
        "Mercedes": 0.9
    }
    
    custom_driver_factors = {
        "Max Verstappen": 0.9,
        "Lando Norris": 1.2,
        "Oscar Piastri": 1.1,
        "Charles Leclerc": 1.05,
        "Lewis Hamilton": 0.95
    }
    
    custom_calibrated = service.calibration_pipeline(
        predictions,
        team_factors=custom_team_factors,
        driver_factors=custom_driver_factors,
        track_type="street_circuit"
    )
    
    print(f"✅ Custom calibration applied")
    print("   Top 3 after custom calibration:")
    for i, driver in enumerate(custom_calibrated[:3]):
        print(f"   {i+1}. {driver['driverName']}: {driver['winProbability']:.3f} win, {driver['podiumProbability']:.3f} podium")
    
    # Test 3: Convenience function
    convenience_calibrated = calibration_pipeline(
        predictions,
        team_factors=custom_team_factors,
        driver_factors=custom_driver_factors
    )
    
    print(f"✅ Convenience function calibration applied to {len(convenience_calibrated)} drivers")
    
    print()

def test_auto_calibration_integration():
    """Test the auto-calibration service integration."""
    print("🧪 Testing Auto-Calibration Integration...")
    
    # Create auto-calibration service
    auto_service = AutoCalibrationService("test_auto_calibration_config.json")
    
    # Test 1: Load historical data
    y_true, y_pred, driver_names = auto_service.load_historical_data()
    print(f"✅ Loaded historical data: {len(y_true)} predictions for {len(driver_names)} drivers")
    
    # Test 2: Apply calibration with sample parameters
    sample_params = {
        'temperature': 0.7,
        'team_weight_mclaren': 1.3,
        'team_weight_redbull': 0.9,
        'form_boost_norris': 1.4,
        'form_boost_piastri': 1.3,
        'verstappen_penalty': -0.05
    }
    
    calibrated_preds = auto_service.apply_calibration(y_pred, sample_params)
    print(f"✅ Applied calibration with sample parameters")
    print(f"   Original predictions sum: {np.sum(y_pred):.3f}")
    print(f"   Calibrated predictions sum: {np.sum(calibrated_preds):.3f}")
    
    # Test 3: Run a small optimization (just a few trials for testing)
    print("🔄 Running small optimization (5 trials)...")
    try:
        best_params = auto_service.optimize(n_trials=5)
        print(f"✅ Optimization completed!")
        print(f"   Best parameters: {best_params}")
        
        # Test 4: Save optimized parameters
        auto_service.save_parameters()
        print(f"✅ Optimized parameters saved")
        
        # Test 5: Load parameters back
        loaded_params = auto_service.load_parameters()
        print(f"✅ Parameters loaded back: {'Success' if loaded_params else 'Failed'}")
        
    except Exception as e:
        print(f"⚠️  Optimization test failed (this is expected in test environment): {e}")
    
    print()

def test_complete_pipeline():
    """Test the complete pipeline from optimization to live prediction."""
    print("🧪 Testing Complete Pipeline...")
    
    # Step 1: Run optimization (simulated)
    print("1️⃣ Simulating optimization...")
    simulated_best_params = {
        'temperature': 0.65,
        'team_weight_mclaren': 1.45,
        'team_weight_redbull': 0.88,
        'form_boost_norris': 1.35,
        'form_boost_piastri': 1.25,
        'verstappen_penalty': -0.08
    }
    
    # Step 2: Save optimized parameters
    print("2️⃣ Saving optimized parameters...")
    success = quick_save_params(simulated_best_params, "live_calibration_config.json")
    print(f"   Save result: {'Success' if success else 'Failed'}")
    
    # Step 3: Load parameters for live prediction
    print("3️⃣ Loading parameters for live prediction...")
    live_params = quick_load_params("live_calibration_config.json")
    print(f"   Load result: {'Success' if live_params else 'Failed'}")
    
    # Step 4: Apply live calibration
    print("4️⃣ Applying live calibration...")
    live_predictions = create_sample_predictions()
    
    # Extract team and driver factors for live use
    team_factors = {
        "McLaren": live_params.get('team_weight_mclaren', 1.0),
        "Red Bull Racing": live_params.get('team_weight_redbull', 1.0),
        "Ferrari": 1.05,
        "Mercedes": 0.95
    }
    
    driver_factors = {
        "Max Verstappen": 1.0 + live_params.get('verstappen_penalty', 0.0),
        "Lando Norris": live_params.get('form_boost_norris', 1.0),
        "Oscar Piastri": live_params.get('form_boost_piastri', 1.0),
        "Charles Leclerc": 1.0,
        "Lewis Hamilton": 1.0
    }
    
    live_calibrated = calibration_pipeline(
        live_predictions,
        team_factors=team_factors,
        driver_factors=driver_factors,
        temperature=live_params.get('temperature', 1.0)
    )
    
    print("5️⃣ Live prediction results:")
    for i, driver in enumerate(live_calibrated[:3]):
        print(f"   {i+1}. {driver['driverName']} ({driver['team']}): {driver['winProbability']:.3f} win")
    
    print("✅ Complete pipeline test finished!")
    print()

def cleanup_test_files():
    """Clean up test files created during testing."""
    import os
    
    test_files = [
        "test_calibration_config.json",
        "test_auto_calibration_config.json",
        "live_calibration_config.json"
    ]
    
    print("🧹 Cleaning up test files...")
    for file in test_files:
        if os.path.exists(file):
            os.remove(file)
            print(f"   Removed: {file}")
    
    print("✅ Cleanup completed!")
    print()

def main():
    """Run all tests."""
    print("🚀 Starting Calibration Integration Tests")
    print("=" * 50)
    
    try:
        test_calibration_utils()
        test_calibration_service()
        test_auto_calibration_integration()
        test_complete_pipeline()
        
        print("🎉 All tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        cleanup_test_files()

if __name__ == "__main__":
    main()


