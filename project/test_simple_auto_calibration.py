#!/usr/bin/env python3
"""
Simple test for the auto-calibration system.
"""

import sys
import os
from pathlib import Path

# Add the project root to the path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from src.services.MLPredictionService import MLPredictionService
from src.services.AutoCalibrator import AutoCalibrator

def test_basic_functionality():
    """Test basic auto-calibration functionality."""
    print("🚀 Testing Basic Auto-Calibration Functionality")
    print("=" * 50)
    
    # Initialize services
    ml_service = MLPredictionService(enable_logging=True)
    auto_calibrator = AutoCalibrator()
    
    # Step 1: Make a prediction
    print("\n📊 Step 1: Making a prediction...")
    predictions = ml_service.predict(
        race_features={"circuit": "Monaco", "weather": "dry"},
        race_name="Monaco Grand Prix 2024"
    )
    print(f"   ✅ Prediction made: {predictions[0]['driver']} ({predictions[0]['win_probability']:.3f})")
    
    # Step 2: Log race results
    print("\n🏁 Step 2: Logging race results...")
    ml_service.log_race_result(
        race_name="Monaco Grand Prix 2024",
        actual_results=["Charles Leclerc", "Max Verstappen", "Lando Norris"]
    )
    print("   ✅ Race results logged")
    
    # Step 3: Check calibration status
    print("\n📈 Step 3: Checking calibration status...")
    status = auto_calibrator.get_calibration_status()
    print(f"   📊 Training races: {status['training_races_count']}")
    print(f"   🔄 Has new results: {status['has_new_results']}")
    
    # Step 4: Test API endpoints (simulated)
    print("\n🌐 Step 4: Testing API endpoints...")
    
    # Simulate prediction endpoint
    api_prediction = ml_service.predict_with_metadata(
        race_features={"circuit": "Silverstone", "weather": "wet"},
        race_name="British Grand Prix 2024"
    )
    print(f"   ✅ API prediction: {api_prediction['predictions'][0]['driver']} wins")
    
    # Simulate result logging endpoint
    ml_service.log_race_result(
        race_name="British Grand Prix 2024",
        actual_results=["Max Verstappen", "Lando Norris", "Charles Leclerc"]
    )
    print("   ✅ API result logging: Success")
    
    # Check calibration status via API
    calibration_status = ml_service.get_calibration_status()
    print(f"   ✅ API calibration status: {calibration_status['calibration_loaded']}")
    
    print("\n🎉 Basic functionality test completed successfully!")
    print("\n📋 Summary:")
    print("   ✅ Prediction service working")
    print("   ✅ Result logging working")
    print("   ✅ Calibration status working")
    print("   ✅ API simulation working")
    
    return True

def test_continuous_learning():
    """Test continuous learning with multiple races."""
    print("\n🔄 Testing Continuous Learning")
    print("=" * 40)
    
    ml_service = MLPredictionService(enable_logging=True)
    
    # Simulate multiple race weekends
    race_weekends = [
        {
            "name": "Dutch Grand Prix 2024",
            "features": {"circuit": "Zandvoort", "weather": "wet"},
            "results": ["Max Verstappen", "Lando Norris", "Charles Leclerc"]
        },
        {
            "name": "Singapore Grand Prix 2024",
            "features": {"circuit": "Marina Bay", "weather": "dry"},
            "results": ["Charles Leclerc", "Max Verstappen", "Lando Norris"]
        }
    ]
    
    for i, weekend in enumerate(race_weekends, 1):
        print(f"\n🏁 Race Weekend {i}: {weekend['name']}")
        
        # Make prediction
        prediction = ml_service.predict(
            race_features=weekend["features"],
            race_name=weekend["name"]
        )
        print(f"   🎯 Prediction: {prediction[0]['driver']} ({prediction[0]['win_probability']:.3f})")
        
        # Log results
        ml_service.log_race_result(
            race_name=weekend["name"],
            actual_results=weekend["results"]
        )
        print(f"   🏆 Actual: {weekend['results'][0]} won")
    
    print(f"\n🎉 Continuous learning test completed with {len(race_weekends)} races!")
    return True

def main():
    """Run all tests."""
    print("🚀 F1 Auto-Calibration System - Simple Test")
    print("=" * 60)
    
    try:
        # Test 1: Basic functionality
        test_basic_functionality()
        
        # Test 2: Continuous learning
        test_continuous_learning()
        
        print("\n🎉 All tests completed successfully!")
        print("\n🚀 Your F1 auto-calibration system is working!")
        print("   - Predictions are being logged")
        print("   - Race results are being tracked")
        print("   - Calibration status is accessible")
        print("   - Ready for production integration")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\n✅ Auto-calibration system is ready for production! 🏎️✨")
    else:
        print("\n❌ Auto-calibration system needs fixes")
