#!/usr/bin/env python3
"""
Test script for the F1 Calibration Auto-Tuning Service

This script demonstrates how to use the AutoCalibrationService to optimize
calibration parameters and generate updated configuration files.
"""

import json
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

from auto_calibration_service import AutoCalibrationService

def test_auto_calibration():
    """Test the auto-calibration service with a small number of trials."""
    print("🚀 Testing F1 Calibration Auto-Tuning Service")
    print("=" * 50)
    
    # Create service instance
    service = AutoCalibrationService(config_path="test_calibration_params.json")
    
    try:
        # Run optimization with a small number of trials for testing
        print("📊 Starting optimization with 10 trials...")
        best_params = service.run_optimization_pipeline(n_trials=10)
        
        print("\n✅ Optimization completed successfully!")
        print(f"📈 Best parameters found:")
        for param, value in best_params.items():
            print(f"   {param}: {value:.4f}")
        
        # Load and display the generated configuration
        print(f"\n📁 Generated configuration:")
        with open(service.config_path, 'r') as f:
            config = json.load(f)
            print(json.dumps(config, indent=2))
        
        # Check if TypeScript file was generated
        ts_path = service.config_path.replace('.json', '.ts')
        if Path(ts_path).exists():
            print(f"\n📄 TypeScript parameters generated: {ts_path}")
            with open(ts_path, 'r') as f:
                print(f.read())
        
        print("\n🎉 Test completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        raise

def test_historical_data_loading():
    """Test the historical data loading functionality."""
    print("\n🔍 Testing historical data loading...")
    
    service = AutoCalibrationService()
    y_true, y_pred, driver_names = service.load_historical_data()
    
    print(f"📊 Loaded {len(y_true)} data points")
    print(f"🏎️ Drivers: {driver_names}")
    print(f"📈 Sample predictions: {y_pred[:5]}")
    print(f"🎯 Sample actual results: {y_true[:5]}")

def test_calibration_application():
    """Test applying calibration to sample predictions."""
    print("\n🔧 Testing calibration application...")
    
    service = AutoCalibrationService()
    
    # Sample predictions
    sample_predictions = np.array([0.4, 0.3, 0.2, 0.08, 0.02])
    
    # Sample parameters
    test_params = {
        'temperature': 0.8,
        'team_weight_mclaren': 1.3,
        'team_weight_redbull': 0.9,
        'form_boost_norris': 1.2,
        'form_boost_piastri': 1.1,
        'verstappen_penalty': -0.1
    }
    
    # Apply calibration
    calibrated = service.apply_calibration(sample_predictions, test_params)
    
    print(f"📊 Original predictions: {sample_predictions}")
    print(f"🎯 Calibrated predictions: {calibrated}")
    print(f"📈 Sum of calibrated: {np.sum(calibrated):.4f}")

if __name__ == "__main__":
    import numpy as np
    
    print("🧪 F1 Calibration Auto-Tuning Service Test Suite")
    print("=" * 60)
    
    # Run tests
    test_historical_data_loading()
    test_calibration_application()
    test_auto_calibration()
    
    print("\n" + "=" * 60)
    print("✅ All tests completed!")


