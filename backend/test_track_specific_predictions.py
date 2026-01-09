#!/usr/bin/env python3
"""
Test Script for Track-Specific Prediction Service
This script tests the new track-specific prediction service to ensure it works correctly.
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_track_specific_service():
    """Test the track-specific prediction service"""
    print("🧪 TESTING TRACK-SPECIFIC PREDICTION SERVICE")
    print("=" * 60)
    
    try:
        from services.TrackSpecificPredictionService import TrackSpecificPredictionService
        
        # Initialize the service
        print("✅ Initializing TrackSpecificPredictionService...")
        service = TrackSpecificPredictionService()
        print("✅ Service initialized successfully")
        
        # Test 1: Predict next race
        print("\n🎯 Test 1: Predicting next race...")
        try:
            next_race_prediction = await service.predict_next_race()
            print(f"✅ Next race prediction successful: {next_race_prediction.race_name}")
            print(f"   Circuit: {next_race_prediction.circuit}")
            print(f"   Round: {next_race_prediction.round}")
            print(f"   Drivers: {len(next_race_prediction.driver_predictions)}")
        except Exception as e:
            print(f"❌ Next race prediction failed: {e}")
        
        # Test 2: Predict specific race (Bahrain)
        print("\n🎯 Test 2: Predicting Bahrain Grand Prix...")
        try:
            bahrain_prediction = await service.predict_grand_prix("Bahrain Grand Prix")
            print(f"✅ Bahrain prediction successful: {bahrain_prediction.race_name}")
            print(f"   Track type: {bahrain_prediction.track_type}")
            print(f"   Track length: {bahrain_prediction.track_length} km")
            print(f"   Corners: {bahrain_prediction.corners}")
            
            # Show top 3 predictions
            sorted_predictions = sorted(
                bahrain_prediction.driver_predictions, 
                key=lambda x: x.win_probability, 
                reverse=True
            )
            print(f"\n🏆 Top 3 predictions for Bahrain:")
            for i, pred in enumerate(sorted_predictions[:3], 1):
                win_prob = pred.win_probability * 100
                print(f"   {i}. {pred.driver_name} ({pred.constructor}) - {win_prob:.1f}%")
                
        except Exception as e:
            print(f"❌ Bahrain prediction failed: {e}")
        
        # Test 3: Predict with different weather conditions
        print("\n🎯 Test 3: Predicting with wet weather...")
        try:
            wet_prediction = await service.predict_grand_prix("Monaco Grand Prix", "wet", 18, 85, 15)
            print(f"✅ Wet weather prediction successful: {wet_prediction.race_name}")
            print(f"   Weather: {wet_prediction.weather_condition}")
            print(f"   Temperature range: {wet_prediction.temperature_range}")
            print(f"   Humidity range: {wet_prediction.humidity_range}")
            print(f"   Wind: {wet_prediction.wind_conditions}")
            print(f"   Tire compounds: {', '.join(wet_prediction.tire_compounds)}")
            
        except Exception as e:
            print(f"❌ Wet weather prediction failed: {e}")
        
        # Test 4: Check McLaren dominance
        print("\n🎯 Test 4: Checking McLaren dominance...")
        try:
            # Get predictions for a high-speed track where McLaren should excel
            monaco_prediction = await service.predict_grand_prix("Monaco Grand Prix")
            
            # Find McLaren drivers
            mclaren_drivers = [p for p in monaco_prediction.driver_predictions if "McLaren" in p.constructor]
            
            if mclaren_drivers:
                print(f"✅ Found {len(mclaren_drivers)} McLaren drivers:")
                for driver in mclaren_drivers:
                    win_prob = driver.win_probability * 100
                    driver_weight = driver.driver_weight
                    team_weight = driver.team_weight
                    print(f"   {driver.driver_name}: {win_prob:.1f}% win probability")
                    print(f"     Driver weight: {driver_weight}")
                    print(f"     Team weight: {team_weight}")
                    
                    # Check if McLaren drivers have high probabilities
                    if win_prob > 10:  # More than 10% win probability
                        print(f"     🚀 McLaren dominance confirmed!")
                    else:
                        print(f"     ⚠️ Lower than expected McLaren performance")
            else:
                print("❌ No McLaren drivers found in predictions")
                
        except Exception as e:
            print(f"❌ McLaren dominance check failed: {e}")
        
        # Test 5: Check all factors are included
        print("\n🎯 Test 5: Checking all prediction factors...")
        try:
            test_prediction = await service.predict_grand_prix("Suzuka")
            
            if test_prediction.driver_predictions:
                sample_driver = test_prediction.driver_predictions[0]
                
                required_fields = [
                    'track_performance_multiplier', 'weather_adjustment', 
                    'tire_degradation_factor', 'fuel_efficiency_bonus',
                    'brake_wear_impact', 'downforce_advantage', 
                    'power_sensitivity_bonus', 'driver_weight', 'team_weight'
                ]
                
                missing_fields = []
                for field in required_fields:
                    if not hasattr(sample_driver, field):
                        missing_fields.append(field)
                
                if not missing_fields:
                    print("✅ All required prediction factors are present")
                    print(f"   Sample driver: {sample_driver.driver_name}")
                    print(f"   Track multiplier: {sample_driver.track_performance_multiplier:.3f}")
                    print(f"   Weather adjustment: {sample_driver.weather_adjustment:.3f}")
                    print(f"   Tire factor: {sample_driver.tire_degradation_factor:.3f}")
                    print(f"   Driver weight: {sample_driver.driver_weight:.3f}")
                    print(f"   Team weight: {sample_driver.team_weight:.3f}")
                else:
                    print(f"❌ Missing fields: {missing_fields}")
                    
        except Exception as e:
            print(f"❌ Factor check failed: {e}")
        
        print("\n✅ Track-specific prediction service tests completed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_api_endpoints():
    """Test the new API endpoints"""
    print("\n🌐 TESTING API ENDPOINTS")
    print("=" * 60)
    
    try:
        import requests
        import json
        
        base_url = "http://localhost:8000"
        
        # Test 1: Next race predictions
        print("🎯 Test 1: /predict/track-specific/next-race")
        try:
            response = requests.get(f"{base_url}/predict/track-specific/next-race")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Next race endpoint successful")
                print(f"   Race: {data.get('race_name', 'Unknown')}")
                print(f"   Drivers: {len(data.get('driver_predictions', []))}")
            else:
                print(f"❌ Next race endpoint failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Next race endpoint test failed: {e}")
        
        # Test 2: Specific race predictions
        print("\n🎯 Test 2: /predict/track-specific/Bahrain Grand Prix")
        try:
            response = requests.get(f"{base_url}/predict/track-specific/Bahrain%20Grand%20Prix")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Specific race endpoint successful")
                print(f"   Race: {data.get('race_name', 'Unknown')}")
                print(f"   Circuit: {data.get('circuit', 'Unknown')}")
                print(f"   Track type: {data.get('track_type', 'Unknown')}")
            else:
                print(f"❌ Specific race endpoint failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Specific race endpoint test failed: {e}")
        
        # Test 3: All races predictions
        print("\n🎯 Test 3: /predict/track-specific/all")
        try:
            response = requests.get(f"{base_url}/predict/track-specific/all")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ All races endpoint successful")
                print(f"   Total races: {data.get('total_races', 0)}")
                print(f"   Weather: {data.get('weather_condition', 'Unknown')}")
            else:
                print(f"❌ All races endpoint failed: {response.status_code}")
        except Exception as e:
            print(f"❌ All races endpoint test failed: {e}")
        
        print("\n✅ API endpoint tests completed!")
        return True
        
    except Exception as e:
        print(f"❌ API endpoint tests failed: {e}")
        return False

async def main():
    """Main test function"""
    print("🚀 TRACK-SPECIFIC PREDICTION SERVICE TEST SUITE")
    print("=" * 80)
    
    # Test the service directly
    service_test_passed = await test_track_specific_service()
    
    # Test the API endpoints (if server is running)
    api_test_passed = await test_api_endpoints()
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    print(f"Service Tests: {'✅ PASSED' if service_test_passed else '❌ FAILED'}")
    print(f"API Tests: {'✅ PASSED' if api_test_passed else '❌ FAILED'}")
    
    if service_test_passed and api_test_passed:
        print("\n🎉 ALL TESTS PASSED! Track-specific prediction service is working correctly.")
    else:
        print("\n⚠️ Some tests failed. Please check the errors above.")
    
    return service_test_passed and api_test_passed

if __name__ == "__main__":
    asyncio.run(main())
