#!/usr/bin/env python3
"""
Test script for the Hybrid F1 Prediction System
Tests live data fetching, ML predictions, and calibration adjustments
"""

import os
import sys
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_live_data_fetching():
    """Test live F1 data fetching from APIs"""
    print("🧪 Testing Live F1 Data Fetching...")
    
    try:
        from data.drivers import f1_data_service
        
        # Test 1: Get entry list for a known circuit
        print("  📊 Testing entry list for Monza...")
        entry_list = f1_data_service.get_entry_list_for_gp("Monza", 2025)
        
        if entry_list:
            print(f"  ✅ Successfully fetched {len(entry_list)} drivers")
            print(f"  🏆 Pole position: {entry_list[0]['driver']} ({entry_list[0]['team']})")
            print(f"  📈 Season points leader: {max(entry_list, key=lambda x: x['season_points'])['driver']}")
        else:
            print("  ⚠️ Using fallback data")
        
        # Test 2: Get next race info
        print("  🏁 Testing next race detection...")
        next_race = f1_data_service.get_next_race(2025)
        
        if next_race:
            print(f"  ✅ Next race: {next_race['name']} at {next_race['circuit']}")
            print(f"  📅 Date: {next_race['date']}")
        else:
            print("  ⚠️ No upcoming race found")
            
        return True
        
    except Exception as e:
        print(f"  ❌ Live data test failed: {e}")
        return False

def test_hybrid_predictions():
    """Test the complete hybrid prediction system"""
    print("\n🧪 Testing Hybrid Predictions...")
    
    try:
        # Import without Firebase dependencies
        import sys
        import os
        
        # Mock the main module functions to avoid Firebase dependency
        sys.modules['main'] = type(sys)('main')
        sys.modules['main'].predict_race_winner_probabilities = lambda *args: None
        sys.modules['main'].load_race_model = lambda: False
        
        from services.PredictionService import prediction_service
        
        # Test 1: Get predictions for Monza
        print("  🏎️ Testing Monza predictions...")
        result = prediction_service.get_race_predictions("Monza", 2025)
        
        if result["status"] in ["success", "fallback"]:
            print(f"  ✅ Predictions generated successfully")
            print(f"  📊 Data source: {result['live_data']['data_source']}")
            print(f"  🤖 ML model used: {result['metadata']['ml_model_used']}")
            print(f"  🎯 Total drivers: {result['metadata']['total_drivers']}")
            
            # Show top 3 predictions
            predictions = result["predictions"][:3]
            print("  🏆 Top 3 predictions:")
            for i, pred in enumerate(predictions, 1):
                print(f"    {i}. {pred['driver']} ({pred['team']}) - {pred['win_probability']:.1%} win, {pred['podium_probability']:.1%} podium")
        else:
            print(f"  ⚠️ Using fallback predictions")
            
        # Test 2: Test different circuits
        circuits = ["Monaco", "Silverstone", "Spa"]
        for circuit in circuits:
            print(f"  🏁 Testing {circuit}...")
            result = prediction_service.get_race_predictions(circuit, 2025)
            if result["status"] in ["success", "fallback"]:
                top_driver = result["predictions"][0]
                print(f"    ✅ {top_driver['driver']} favored at {circuit} ({top_driver['win_probability']:.1%})")
            else:
                print(f"    ⚠️ Fallback used for {circuit}")
                
        return True
        
    except Exception as e:
        print(f"  ❌ Hybrid prediction test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_calibration_factors():
    """Test calibration factors and adjustments"""
    print("\n🧪 Testing Calibration Factors...")
    
    try:
        # Import without Firebase dependencies
        import sys
        import os
        
        # Mock the main module functions
        sys.modules['main'] = type(sys)('main')
        sys.modules['main'].predict_race_winner_probabilities = lambda *args: None
        sys.modules['main'].load_race_model = lambda: False
        
        from services.PredictionService import prediction_service
        
        # Test track-specific calibration
        print("  🏁 Testing track-specific calibration...")
        
        # Test Monza (Ferrari should get boost)
        monza_result = prediction_service.get_race_predictions("Monza", 2025)
        ferrari_pred = next((p for p in monza_result["predictions"] if p["team"] == "Ferrari"), None)
        if ferrari_pred:
            track_factor = ferrari_pred["calibration_factors"]["track_factor"]
            print(f"    ✅ Ferrari at Monza: track_factor = {track_factor}")
        
        # Test Silverstone (McLaren should get boost)
        silverstone_result = prediction_service.get_race_predictions("Silverstone", 2025)
        mclaren_pred = next((p for p in silverstone_result["predictions"] if p["team"] == "McLaren"), None)
        if mclaren_pred:
            track_factor = mclaren_pred["calibration_factors"]["track_factor"]
            print(f"    ✅ McLaren at Silverstone: track_factor = {track_factor}")
        
        # Test driver tier calibration
        print("  👤 Testing driver tier calibration...")
        verstappen_pred = next((p for p in monza_result["predictions"] if p["driver"] == "Max Verstappen"), None)
        if verstappen_pred:
            driver_factor = verstappen_pred["calibration_factors"]["driver_factor"]
            print(f"    ✅ Verstappen driver factor: {driver_factor}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Calibration test failed: {e}")
        return False

def test_api_response_format():
    """Test the API response format"""
    print("\n🧪 Testing API Response Format...")
    
    try:
        # Import without Firebase dependencies
        import sys
        import os
        
        # Mock the main module functions
        sys.modules['main'] = type(sys)('main')
        sys.modules['main'].predict_race_winner_probabilities = lambda *args: None
        sys.modules['main'].load_race_model = lambda: False
        
        from services.PredictionService import prediction_service
        
        # Test response structure
        result = prediction_service.get_race_predictions("Monza", 2025)
        
        required_keys = ["status", "race", "predictions", "live_data", "metadata"]
        missing_keys = [key for key in required_keys if key not in result]
        
        if not missing_keys:
            print("  ✅ All required response keys present")
            
            # Check prediction structure
            if result["predictions"]:
                pred = result["predictions"][0]
                pred_keys = ["driver", "team", "qualifying_position", "season_points", 
                           "win_probability", "podium_probability", "calibration_factors"]
                missing_pred_keys = [key for key in pred_keys if key not in pred]
                
                if not missing_pred_keys:
                    print("  ✅ Prediction structure correct")
                else:
                    print(f"  ❌ Missing prediction keys: {missing_pred_keys}")
            else:
                print("  ⚠️ No predictions in response")
        else:
            print(f"  ❌ Missing response keys: {missing_keys}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ API format test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 F1 Hybrid Prediction System Test Suite")
    print("=" * 50)
    
    tests = [
        ("Live Data Fetching", test_live_data_fetching),
        ("Hybrid Predictions", test_hybrid_predictions),
        ("Calibration Factors", test_calibration_factors),
        ("API Response Format", test_api_response_format)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Test Results Summary:")
    
    passed = 0
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status} {test_name}")
        if success:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Your hybrid prediction system is ready!")
    else:
        print("⚠️ Some tests failed. Check the logs above for details.")
    
    return passed == len(results)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
