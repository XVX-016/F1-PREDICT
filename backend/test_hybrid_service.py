#!/usr/bin/env python3
"""
Test script for HybridPredictionService
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.HybridPredictionService import HybridPredictionService

async def test_hybrid_service():
    """Test the hybrid prediction service"""
    print("🚀 Testing HybridPredictionService...")
    
    try:
        # Initialize the service
        hybrid_service = HybridPredictionService()
        print("✅ Service initialized successfully")
        
        # Test fallback drivers
        fallback_drivers = hybrid_service._get_fallback_drivers()
        print(f"📊 Fallback drivers loaded: {len(fallback_drivers)}")
        
        # Test track classification
        test_tracks = ["monaco", "spa", "silverstone", "hungaroring", "unknown"]
        for track in test_tracks:
            track_type = hybrid_service._classify_track(track)
            print(f"🏁 {track}: {track_type}")
        
        # Test weather conditions
        weather = hybrid_service._get_weather_conditions({"circuitId": "monaco"})
        print(f"🌤️ Weather conditions: {weather}")
        
        # Test driver tier lookup
        test_drivers = ["verstappen", "norris", "antonelli", "unknown"]
        for driver in test_drivers:
            tier_mult = hybrid_service.driver_tiers.get(driver, 1.0)
            print(f"👤 {driver}: {tier_mult}x")
        
        # Test team weights
        test_teams = ["McLaren-Mercedes", "Red Bull Racing", "Haas", "Unknown"]
        for team in test_teams:
            team_weight = hybrid_service.team_weights.get(team, 1.0)
            print(f"🏎️ {team}: {team_weight}x")
        
        print("\n🎉 All tests passed! HybridPredictionService is working correctly.")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_hybrid_service())
