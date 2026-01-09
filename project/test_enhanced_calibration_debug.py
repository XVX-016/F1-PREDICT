#!/usr/bin/env python3
"""
Debug script for enhanced calibration update process.
"""

import sys
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from src.services.EnhancedAutoCalibrator import EnhancedAutoCalibrator

def test_script_generation():
    """Test the enhanced tuning script generation."""
    print("🧪 Testing Enhanced Tuning Script Generation...")
    
    # Initialize enhanced calibrator
    calibrator = EnhancedAutoCalibrator()
    
    # Prepare training data
    training_data = calibrator.prepare_enhanced_training_data()
    print(f"   Training data samples: {len(training_data)}")
    
    if training_data:
        # Show first sample structure
        sample = training_data[0]
        print(f"   Sample keys: {list(sample.keys())}")
        print(f"   Predictions count: {len(sample.get('predictions', []))}")
        
        if sample.get('predictions'):
            first_pred = sample['predictions'][0]
            print(f"   First prediction keys: {list(first_pred.keys())}")
    
    # Test script generation
    try:
        calibrator._create_enhanced_tuning_script(training_data)
        print("   ✅ Script generation successful")
        
        # Check if file was created
        import os
        if os.path.exists("enhanced_tune_calibration.py"):
            with open("enhanced_tune_calibration.py", "r") as f:
                content = f.read()
            print(f"   ✅ Script file created ({len(content)} characters)")
            
            # Check for key components
            if "def objective(trial):" in content:
                print("   ✅ Objective function found")
            if "optuna.create_study" in content:
                print("   ✅ Optuna study creation found")
            if "sys.argv" in content:
                print("   ✅ Command line argument handling found")
        else:
            print("   ❌ Script file not created")
            
    except Exception as e:
        print(f"   ❌ Script generation failed: {str(e)}")
        import traceback
        traceback.print_exc()

def test_calibration_update():
    """Test the calibration update process."""
    print("\n🧪 Testing Calibration Update Process...")
    
    # Initialize enhanced calibrator
    calibrator = EnhancedAutoCalibrator()
    
    # Force update with minimal trials
    try:
        success = calibrator.update_enhanced_calibration(n_trials=5, force_update=True)
        print(f"   Calibration update result: {'✅ Success' if success else '❌ Failed'}")
    except Exception as e:
        print(f"   ❌ Calibration update error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🔍 Enhanced Calibration Debug Test")
    print("=" * 50)
    
    test_script_generation()
    test_calibration_update()





